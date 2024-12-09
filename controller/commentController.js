import { Comments } from "../modals/commentModal";
import { Post } from "../modals/postsModel";
import { User } from "../modals/userModel";


export const addComment = async(req, res)=>{
    try {
        const {id} = req.params;
        if(!id){
            return res.status(404).json({
                message:"Id not found",
                success: false
            });
        };
        const text = req.body;
        if(!text){
            return res.status(404).json({
                message:"Text is not found",
                success: false
            });
        };
        const existingPost = await Post.findById(id);
        if(!existingPost){
            return res.status(404).json({
                message:"Post not found",
                success: false
            });
        };
        const comment = new Comments({
            text,
            post:existingPost._id,
            admin:req.user._id
        });
        const newComment = await comment.save();
        await Post.findByIdAndUpdate(id,{
            $push:{comments:newComment._id}
        },{new:true})
        await User.findByIdAndUpdate(req.user._id,{
            $push:{replies:newComment._id}
        },{new:true});
        res.status(200).json({
            message: "Comment added",
            success: true
        });
    } catch (error) {
        return res.status(400).json({
            message:error.message,
            success:false
        });
    };
};

export const deleteComment = async(req, res)=>{
    try {
        const {postId, id} = req.params;
        if(!postId || !id){
            return res.status(404).json({
                message:"Post id and comment id not found",
                success:false
            });
        };
        const existingPost = await Post.findById(postId);
        if(!existingPost){
            return res.status(404).json({
                message:"Post id not found",
                success:false
            });
        };
        const  commentExist = await Post.findById(id);
        if(!commentExist){
            return res.status(404).json({
                message:"Comment id not found",
                success:false
            });
        };
        const newId = await Comments.findById(id);
        if(existingPost.comments.includes(newId)){
            const id1 = commentExist.admin._id.toString();
            const id2 = req.user._id.toString();
            if(!id1 !== id2){
                return res.status(300).json({
                    message: "Your arfe not authorized",
                    success: false
                });
            };
            await Post.findByIdAndUpdate(id,{$pull:{comments:id}},{new:true});
        await User.findByIdAndUpdate(req.user._id,{$pull:{replies:id}},{new:true});
        return res.status(201).json({
            message:'Comment deleted'
        })
        };
         
        return res.status(201).json({
            message:'THis post dos"t includes the comment'
        });
    } catch (error) {
        return res.status(400).json({
            message:error.message,
            success:false
        });
    };
};