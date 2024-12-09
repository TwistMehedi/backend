import { User } from "../modals/userModel.js";
import formidalbe from "formidable";
import jwt from "jsonwebtoken";
import { cloudinary } from "../db/cloudinary.js";

export const registerUser = async (req, res) => {
  try {
    const { userName, email, password } = req.body;
    if (!userName || !email || !password) {
      return res.status(404).json({
        message: "Somthing is missing",
        sucsses: false,
      });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: `User alredy exist thi mail ${email}`,
        success: false,
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    if (!hashedPassword) {
      return res.status(400).json({
        message: "Password hashed problem",
        success: false,
      });
    }
    const user = new User({
      userName,
      email,
      password: hashedPassword,
    });
    const result = await user.save();
    if (!result) {
      res.status(400).json({
        message: "User registration problem",
      });
    }
    const accessToken = jwt.sing(
      { token: result._id },
      process.env.SECRET_KEY,
      { expiresIn: "1d" }
    );
    if (!accessToken) {
      res.status(400).json({
        message: "TOken error",
        success: false,
      });
    }
    res.cookie("token", accessToken, {
      maxAge: 12 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "none",
      secure: true,
    });
    res.status(200).json({
      message: "User registration successfull",
      success: false,
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message,
      success: false,
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { userName, email } = req.body;
    if (!userName || !email) {
      return res.status(404).json({
        message: "Somthing is missing",
        sucsses: false,
      });
    }
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res.status(404).json({
        message: "User not found",
        sucsses: false,
      });
    }
    const isPasswordMatch = bcrypt.compare(password, existingUser.password);
    if (!isPasswordMatch) {
      return res.status(404).json({
        message: "Invalid email and password",
        sucsses: false,
      });
    }

    const accessToken = jwt.sign(
      { token: existingUser._id },
      process.env.SECRET_KEY,
      { expiresIn: "1d" }
    );
    if (!accessToken) {
      res.status(400).json({
        message: "TOken error",
        success: false,
      });
    }

    res.cookie("token", accessToken, {
      maxAge: 12 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "none",
      secure: true,
    });
    res.status(200).json({
      message: "User login successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      message: error.message,
      success: false,
    });
  }
};

export const userDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id)
      .select("-password")
      .populate("followers")
      .populate({
        path: "threads",
        populate: [{ path: "likes" }, { path: "comments" }, { path: "admin" }],
      })
      .populate({ path: "replies", populate: { path: "admin" } })
      .populate({
        path: "repost",
        populate: [{ path: "admin" }, { path: "likes" }, { path: "comments" }],
      });
    res.status(201).json({
      message: "User Details featchd",
      user,
      success: true,
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message,
      success: false,
    });
  }
};

export const following = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(404).json({
        message: "id not found",
        success: false,
      });
    }

    const existingUser = await User.findById(id);
    if (!existingUser) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    if (existingUser.followers.includes(req.user._id)) {
      await User.findByIdAndUpdate(
        existingUser._id,
        {
          $pull: { followers: req.user._id },
        },
        { new: true }
      );
      return res.status(404).json({
        message: "User unfollowed",
        success: false,
      });
    }
    await User.findByIdAndUpdate(
      existingUser._id,
      {
        $push: { followers: req.user._id },
      },
      { new: true }
    );
    return res.status(404).json({
      message: "User Followed",
      success: false,
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message,
      success: false,
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const existingUser = await User.findById(req.user._id);
    if (!existingUser) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }
    const form = formidalbe({});
    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res.status(404).json({
          message: "Formidablr error",
          success: false,
        });
      }

      if (fields.text) {
        await User.findByIdAndUpdate(
          req.user._id,
          { bio: fields.text },
          { new: true }
        );
      }

      if (files.media) {
        if (existingUser.public_id) {
          await cloudinary.uploder.destroy(
            existingUser.public_id,
            (err, result) => {
              console.log(err, result);
            }
          );
        }
      }
    });

    const uplodedImage = await cloudinary.uploder.upload(files.media.filepath, {
      folder: "Threads_clone/Profile",
    });
    if (!uplodedImage) {
      return res.status(400).json({
        message: "Image upload fail in formidable",
        success: false,
      });
    }

    await User.findByIdAndUpdate(
      req.user._id,
      {
        profilePic: uplodedImage.secure_url,
        public_id: uplodedImage.public_id,
      },
      { new: true }
    );
  } catch (error) {
    return res.status(400).json({
      message: error.message,
      success: false,
    });
  }

  res.status(201).json({
    message: "Profile update successfully",
    success: false,
  });
};

export const searchUsers = async(req, res)=>{
  try {
    const {query}=req.params;
    const users = await User.find({
      $or:[
        {userName: {$regex:query,$options:"i"}}
      ]
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message,
      success: false,
    });
  };
};

export const myInfo = async(req, res)=>{
  try {
    const {id} = req.params;
    const user = await User.findById(id)
    res.status(200).json({user});
  } catch (error) {
    return res.status(400).json({
      message: error.message,
      success: false,
    });
  };
};

export const singOut = async (req, res) => {
  try {
    return res.status(200).cookie("token", "", { expires: 0, maxAge: 0 });
  } catch (error) {
    return res.status(400).json({
      message: error.message,
      success: false,
    });
  }
};
