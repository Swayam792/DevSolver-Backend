import QuestionModel from "../../models/questionModel.js";
import UserModel from "../../models/userModel.js";
import authChecker from "../../helpers/authChecker.js";
import errorHandler from "../../helpers/errorhandler.js";
import pkg from 'graphql';
const {GraphQlError} = pkg;

const ansCommentResolver = {
    Mutation: {
        addAnsComment: async (_,args, context) => {
            const loggedUser = authChecker(context);
            const { quesId, ansId, body } = args;

            if (body.trim() === '' || body.length < 5) {
                throw new GraphQlError('Comment must be atleast 5 letters.');
            }

            try{
                const question = await QuestionModel.findById(quesId);
                if(!question){
                    throw new GraphQlError(`The question with id ${quesId} not exist`);
                }

                const targetAnswer = question.answers.find(
                    (a) => a._id.toString() === ansId
                );

                if(!targetAnswer){
                    throw new GraphQlError(`The answer with id ${ansId} not exist`);
                }

                targetAnswer.comments.push({ body, author: loggedUser.id});

                question.answers = question.answers.map((a) => a._id.toString() !== ansId ? a : targetAnswer);

                const savedQues = await question.save();
                const populatedQues = await savedQues.populate('answers.comments.author', 'username');
                const updatedAnswer = populatedQues.answers.find(
                    (a) => a._id.toString() === ansId
                );
                return updatedAnswer.comments;
            }catch(err){
                throw new GraphQlError(errorHandler(err));
            }
        },
        deleteAnsComment: async (_, args, context) => {
            const loggedUser = authChecker(context);
            const { quesId, ansId, commentId } = args;
      
            try {
              const user = await UserModel.findById(loggedUser.id);
              const question = await QuestionModel.findById(quesId);
              if (!question) {
                throw new GraphQlError(`Question with Id: ${quesId} does not exist.`);
              }
      
              const targetAnswer = question.answers.find((a) => a._id.toString() === ansId);
      
              if (!targetAnswer) {
                throw new GraphQlError(
                  `Answer with Id: '${ansId}' does not exist.`
                );
              }
      
              const targetComment = targetAnswer.comments.find((c) => c._id.toString() === commentId);
      
              if (!targetComment) {
                throw new GraphQlError(`Comment with ID: '${commentId}' does not exist.`);
              }
      
              if (targetComment.author.toString() !== user._id.toString() &&
                user.role !== 'admin') {
                throw new GraphQlError('You are not authenticated to do this action.');
              }
      
              targetAnswer.comments = targetAnswer.comments.filter((c) => c._id.toString() !== commentId);
      
              question.answers = question.answers.map((a) => a._id.toString() !== ansId ? a : targetAnswer);
      
              await question.save();
              return commentId;
            } catch (err) {
              throw new GraphQlError(errorHandler(err));
            }
        },
        editAnsComment: async (_, args, context) => {
            const loggedUser = authChecker(context);
            const { quesId, ansId, commentId, body } = args;
      
            if (body.trim() === '' || body.length < 5) {
              throw new GraphQlError('Comment must be atleast 5 characters long.');
            }
      
            try {
              const question = await QuestionModel.findById(quesId);
              if (!question) {
                throw new GraphQlError(`Question with Id: ${quesId} does not exist.`);
              }
      
              const targetAnswer = question.answers.find((a) => a._id.toString() === ansId);
      
              if (!targetAnswer) {
                throw new GraphQlError(
                  `Answer with Id: '${ansId}' does not exist.`
                );
              }
      
              const targetComment = targetAnswer.comments.find((c) => c._id.toString() === commentId);
      
              if (!targetComment) {
                throw new GraphQlError(
                  `Comment with Id: '${commentId}' does not exist.`
                );
              }
      
              if (targetComment.author.toString() !== loggedUser.id.toString()) {
                throw new GraphQlError('You are not authenticated to do this action.');
              }
      
              targetComment.body = body;
              targetComment.updatedAt = Date.now();
      
              targetAnswer.comments = targetAnswer.comments.map((c) =>
                c._id.toString() !== commentId ? c : targetComment
              );
              question.answers = question.answers.map((a) =>
                a._id.toString() !== ansId ? a : targetAnswer
              );
      
              const savedQues = await question.save();
              const populatedQues = await savedQues
                .populate('answers.comments.author', 'username');
      
              const updatedAnswer = populatedQues.answers.find((a) => a._id.toString() === ansId);
      
              return updatedAnswer.comments;
            } catch (err) {
              throw new GraphQlError(errorHandler(err));
            }
        },
    }
};

export default ansCommentResolver;