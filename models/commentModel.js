import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    body: {
        type: String,
        required: true,
        trim: true,
        minLength: 5
    }
}, {
    timestamps: true
});

const CommentModel = mongoose.model('Comment', commentSchema);

export default CommentModel;