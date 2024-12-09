import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
    admin:{type:mongoose.Schema.Types.ObjectId,ref:"user"},
    text:{type:String},
    media:{type:String},
    public_id:{type:String},
    likes:[{type:mongoose.Schema.Types.ObjectId,ref:"user"}],
    comments:[{type:mongoose.Schema.Types.ObjectId,ref:"user"}]
},{timestamps:true});
export const Post = mongoose.model("post",postSchema);