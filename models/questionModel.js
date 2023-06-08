import mongoose from "mongoose";
import CommentModel from "./commentModel.js"; 
import AnswerModel from "./answerModel.js";

export const questionSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
        minLength: 15
    },
    body: {
        type: String,
        required: true,
        trim: true,
        minLength: 30
    },
    tags: [
        {
            type: String,
            required: true,
            trim: true,
        }
    ],
    comments: [CommentModel.schema],
    answers: [AnswerModel.schema],
    points: {
        type: Number,
        default: 0
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
    views: {
        type: Number,
        default: 0
    },
    hotAlgo: {
        type: Number,
        default: Date.now
    },
    acceptedAnswer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Answer'
    }    
},
  {timestamps: true}
);

const QuestionModel = mongoose.model('Question', questionSchema);
export default QuestionModel;