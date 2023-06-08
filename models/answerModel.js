import mongoose from "mongoose";
import CommentModel from "./commentModel.js";

const answerSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    body: {
        type: String,
        required: true,
        trim: true,
        minLength: 30
    },
    comments: [CommentModel.schema],
    points: {
        type: Number,
        default: 0,
    },
    upvotedBy: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    downvotedBy: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
}, {
    timestamps: true
});

const AnswerModel = mongoose.model('Answer', answerSchema);

export default AnswerModel;