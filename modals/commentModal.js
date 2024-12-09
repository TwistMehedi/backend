import mongoose, { Schema, Types } from "mongoose";

const commentSchema = new mongoose.Schema({
    admin:{type:mongoose.Schema.Types.ObjectId,ref:"user"},
    post:{type:mongoose.Schema.Types.ObjectId,ref:"user"},
    text:{type:String}
},{timestamps:true});

export const Comments = mongoose.model("comment",commentSchema);