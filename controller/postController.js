import formidable from "formidable";
import { Post } from "../modals/postsModel";
import { cloudinary } from "../db/cloudinary";
import { Comments } from "../modals/commentModal";
import { User } from "../modals/userModel";
import mongoose from "mongoose";

export const addPost = async(req, res)=>{
    try {
        const form = formidable();
        form.parse(req,async(err,fields,files)=>{
            if(err){
                return res.status(400).json({
                    message: err.message,
                    success: false,
                  });
            };

            const post = new Post();
            if(fields.text){
                post.text = fields.text
            };

            if(files.media){
                const uplodedImage = await cloudinary.uploader.upload(
                    files.media.filepath,
                    {folder:"Threads_clone/Posts"}
                );

                if(!uplodedImage){
                    return res.status(400).json({
                        message: "Error image upload",
                        success: false,
                      });
                };
                post.media = uplodedImage.secure_url;
                post.public_id = uplodedImage.public_id;
            };
            post.admin = req.user._id
            const newPost = await post.save();
            await User.findByIdAndUpdate(
                req.user._id,
                {
                    $push:{threads:newPost._id}
                },
                {new:true}
            )
        });
        res.status(400).json({
            message: "Post created",
            newPost,
            success: true
          });
    } catch (error) {
        return res.status(400).json({
            message: error.message,
            success: false,
          });
    }
};

export const getAllPosts = async(req, res)=>{
    try {
        const {page} = req.query;
        let pageNumber = page;
        if(!page || page == undefined){
            pageNumber = 1
        };
        const posts = await Post.find({}).sort({cretedAt: -1}).skip((pageNumber-1)*3).limit(3).populate("admin").populate("likes").populate({
            path:"comment",
            populate:{
                path:"admin",
                model:"user"
            }
        });
        res.status(200).json({
            message: "Post get success",
            posts,
            success: true
          });
    } catch (error) {
        res.status(400).json({
            message: error.message,
            success: false,
          });
    }
};

export const deletePost = async(req, res)=>{
    try {
        const {id} = req.params;
        if(!id){
            return res.status(404).json({
                message: "User id not found",
                success: false
            });
        };

        const existingPost = await Post.findById(id);
        if(!existingPost){
            res.status(404).json({
                message: "Post not found",
                success: false,
              });
        };

        const userId = req.user._id.toString();
        const adminId = existingPost.admin._id.toString();
        if(userId !== adminId){
            res.status(400).json({
                message: "You unauthorized",
                success: false,
              });
        };
        if(existingPost.media){
            await cloudinary.uploader.destroy(
                existingPost.public_id,
                (error, result)=>{console.log(error, result);
                }
            )
        };
        await Comments.deleteMany({_id:{$in:existingPost.comment}});
        await User.deleteMany(
            {
                $or:[{threads:id},{replies:id},{repost:id}]
            },
             {
                $pull:{threads:id,replies:id,repost:id}
             },
             {new:true}
        );
        await Post.findByIdAndDelete(id);
        res.status(202).json({
            message: "Post deleted",
            success: true
          });

    } catch (error) {
        res.status(400).json({
            message: error.message,
            success: false,
          });
    }
};

export const postLikeAndUnlike = async(req, res)=>{
    try {
        const {id} = req.params;
        if(!id){
            return res.status(404).json({
                message: "User id not found",
                success: false
            });
        };
        const existingPost = await Post.findById(id);
        if(!existingPost){
            res.status(404).json({
                message: "Post not found",
                success: false,
              });
        };
        if(existingPost.likes.includes(req.user._id)){
            await Post.findByIdAndUpdate(id,
                {
                    $pull:{likes:req.user._id},
                },
                {new:true}
            );
            return res.status(400).json({
                message:'Unliked',
                success:false
            });
        };
        await Post.findByIdAndUpdate(
            id,
            {
                $push:{likes:req.user._id}
            },
            {new:true}
        );
        return res.status(400).json({
            message:'Post liked',
            success:true
        });

    } catch (error) {
        res.status(400).json({
            message: error.message,
            success: false,
          });
    };
};

export const repost = async(req, res)=>{
    try {
        const {id} = req.params;
        if(!id){
            return res.status(400).json({
                message:'User id not found',
                success:false
            });
        };

        const existingPost = await Post.findById(id);
        if(!existingPost){
            res.status(404).json({
                message: "such no post",
                success: false,
              });
        };

        const newId = req.user._id.toString();
        if(existingPost.repost.includes(newId)){
            if(!existingPost){
                res.status(400).json({
                    message: "This post alredy repost",
                    success: false,
                  });
            };
        };

        await Post.findByIdAndUpdate(
            req.user._id,
            {
                $push:{repost:existingPost._id}
            },
            {new:true}
        );
        res.status(200).json({
            message:"Repost successfull",
            success:true
        });
    } catch (error) {
        return res.status(400).json({
            message:error.message,
            success:false
        });
    };
};

export const singlePost = async(req, res)=>{
    try {
        const {id} = req.params;
        const post = await Post.findById(id).populate({path:"admin",select:"-password"}).populate({path:"likes"}).populate({
            path:"comment",
            populate:{
                path:"admin"
            }
        });
        res.status(200).json({
            message:"Single Post Found",
            post,
            success: true
        });

    } catch (error) {
        res.status(400).json({
            message:error.message,
            success:false
        });
    };
};