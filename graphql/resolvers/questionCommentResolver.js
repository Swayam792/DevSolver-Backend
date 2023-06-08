import QuestionModel from "../../models/questionModel.js";
import UserModel from "../../models/userModel.js"; 
import pkg from 'graphql';
import errorHandler from "../../helpers/errorhandler.js";
import authChecker from "../../helpers/authChecker.js";
const {GraphQlError} = pkg;

const QuestionCommentResolver = {
    Mutation : {
        addQuesComment: async (_, args, context) => {
            const loggedUser = authChecker(context);
            const { quesId, body } = args;
            
            if(body.trim() === '' || body.length < 5){
                throw new GraphQlError('Comment must be atleast 5 characters long.');
            }

            try{
               const question = await QuestionModel.findById(quesId);
               if(!question){
                throw new GraphQlError(`Question with ID: ${quesId} does not exist.`);
               }

               question.comments.push({body, author: loggedUser.id});

               const savedQues = await question.save();
               const populatedQues = await savedQues.populate('comments.author', 'username');
               return populatedQues.comments;
            }catch(err){
                throw new GraphQlError(errorHandler(err));
            }
        },
        deleteQuesComment: async (_, args, context) => {
            const loggedUser = authChecker(context);
            const { quesId, commentId } = args;

            try{
                const user = await UserModel.findById(loggedUser.id);
                const question = await QuestionModel.findById(quesId);
                if(!question){
                    throw new GraphQlError(`Question with ID: ${quesId} does not exist.`);
                }

                const targetComment = question.comments.find((c) => c._id.toString() === commentId);

                if(!targetComment){
                    throw new GraphQlError(`Comment with ID: '${commentId}' does not exist.`);
                }

                if(targetComment.author.toString() !== user._id.toString() && user.role !== 'admin'){
                    throw new GraphQlError(`You are not authenticate to do this action!`);
                }

                question.comments = question.comments.filter((c) => c._id.toString() !== commentId);
                await question.save();
                return commentId;
            }catch(err){
                throw new GraphQlError(errorHandler(err));
            }
        },
        editQuesComment: async (_, args, context) => {
            const loggedUser = authChecker(context);
            const { quesId, commentId, body } = args;

            if(body.trim() === '' || body.length < 5){
                throw new GraphQlError('Comment must be atleast 5 letter.');
            }

            try{
                const question = await QuestionModel.findById(quesId);
                if(!question){
                    throw new GraphQlError(`Question with ID: ${quesId} does not exist!`);
                }

                const targetComment = question.comments.find((c) => c._id.toString() === commentId);

                if(!targetComment){
                    throw new GraphQlError(`Comment with ID: '${commentId}' does not exist.`);
                }

                targetComment.body = body;
                targetComment.updatedAt = Date.now();

                question.comments = question.comments.map((c) => c._id.toString() !== commentId ? c : targetComment);
                const savedQues = await question.save();
                const populatedQues = await savedQues.populate('comments.author', 'username');

                return populatedQues.comments;
            }catch(err){
                throw new GraphQlError(errorHandler(err));
            }
        }
    }
}

export default QuestionCommentResolver;