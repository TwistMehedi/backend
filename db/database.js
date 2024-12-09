import mongoose from "mongoose";

const database = async(req, res)=>{
 try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("database connention succesfully");

 } catch (error) {
    console.log(error);
   //  return res.status(400).json({
   //      message: error.message,
   //      success: false
   //  });
 }}

 export default database;