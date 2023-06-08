import QuestionModel from "../../models/questionModel.js";
import UserModel from "../../models/userModel.js";
import authChecker from "../../helpers/authChecker.js";
import errorHandler from "../../helpers/errorhandler.js";
import { upvoteIt, downvoteIt, ansRep} from "../../helpers/helperFunctions.js";
import pkg from "graphql";
const { GraphQLError } = pkg;

const answerResolver = {
    Mutation: {
        postAnswer: async (_, args, context) => {
            const loggedUser = authChecker(context);
            const { quesId, body } = args;

            if(body.trim() === '' || body.length < 5){
                throw new GraphQLError('Answer must be atleast 30 letters.')
            }

            try {
                const author = await UserModel.findById(loggedUser.id);
                const question = await QuestionModel.findById(quesId);
                if (!question) {
                throw new GraphQLError(
                    `Question with ID: ${quesId} does not exist in DB.`
                );
                }

                question.answers.push({ body,author: author._id});
                const savedQues = await question.save();
                const populatedQues = await savedQues.populate([{path: 'answers.author', select: 'username'}, {path: 'answers.comments.author', select: 'username'}]);

                author.answers.push({ansId: savedQues.answers[savedQues.answers.length - 1]._id});
                await author.save();

                return populatedQues.answers;
            }catch(err){
                throw new GraphQLError(errorHandler(err));
            }
        },
        deleteAnswer: async (_, args, context) => {
            const loggedUser = authChecker(context);
            const { quesId, ansId } = args;
      
            try {
              const user = await UserModel.findById(loggedUser.id);
              const question = await QuestionModel.findById(quesId);
              if (!question) {
                throw new GraphQLError(
                  `Question with ID: ${quesId} does not exist.`
                );
              }
      
              const targetAnswer = question.answers.find((a) => a._id.toString() === ansId);
      
              if (!targetAnswer) {
                throw new GraphQLError(`Answer with ID: '${ansId}' does not exist.`);
              }
      
              if (targetAnswer.author.toString() !== user._id.toString() &&
                user.role !== 'ADMIN') {
                throw new GraphQLError('You are not authorized to do this action.');
              }
      
              question.answers = question.answers.filter((a) => a._id.toString() !== ansId);
              await question.save();
              return ansId;
            } catch (err) {
              throw new GraphQLError(errorHandler(err));
            }
        },
        editAnswer: async (_, args, context) => {
            const loggedUser = authChecker(context);
            const { quesId, ansId, body } = args;
      
            if (body.trim() === '' || body.length < 30) {
              throw new GraphQLError('Answer must be atleast 30 characters long.');
            }
      
            try {
              const question = await QuestionModel.findById(quesId);
              if (!question) {
                throw new GraphQLError( `Question with ID: ${quesId} does not exist.`);
              }
      
              const targetAnswer = question.answers.find( (a) => a._id.toString() === ansId);
      
              if (!targetAnswer) {
                throw new GraphQLError(`Answer with ID: '${ansId}' does not exist.`);
              }
      
              if (targetAnswer.author.toString() !== loggedUser.id.toString()) {
                throw new GraphQLError('You are not authorized to do this action.');
              }
      
              targetAnswer.body = body;
              targetAnswer.updatedAt = Date.now();
      
              question.answers = question.answers.map((a) => a._id.toString() !== ansId ? a : targetAnswer);
      
              const savedQues = await question.save();
              const populatedQues = await savedQues.populate([{path: 'answers.author',select: 'username'}, {path: 'answers.comments.author',select: 'username'}]);
      
              return populatedQues.answers;
            } catch (err) {
              throw new GraphQLError(errorHandler(err));
            }
        },
        voteAnswer: async (_, args, context) => {
            const loggedUser = authChecker(context);
            const { quesId, ansId, voteType } = args;
      
            try {
              const user = await UserModel.findById(loggedUser.id);
              const question = await QuestionModel.findById(quesId);
              if (!question) {
                throw new GraphQLError(`Question with ID: ${quesId} does not exist.`);
              }
      
              const targetAnswer = question.answers.find((a) => a._id.toString() === ansId);
      
              if (!targetAnswer) {
                throw new GraphQLError(`Answer with ID: '${ansId}' does not exist.`);
              }
      
              if (targetAnswer.author.toString() === user._id.toString()) {
                throw new GraphQLError("You can't vote for your own post.");
              }
      
              let votedAns;
              if (voteType === 'UPVOTE') {
                votedAns = upvoteIt(targetAnswer, user);
              } else {
                votedAns = downvoteIt(targetAnswer, user);
              }
      
              question.answers = question.answers.map((a) => a._id.toString() !== ansId ? a : votedAns);
      
              const savedQues = await question.save();
              const populatedQues = await savedQues.populate([{path: 'answers.author', select: 'username'}, {path: 'answers.comments.author', select: 'username'}]);
      
              const author = await UserModel.findById(targetAnswer.author);
              const addedRepAuthor = ansRep(targetAnswer, author);
              await addedRepAuthor.save();
      
              return populatedQues.answers.find((a) => a._id.toString() === ansId);
            } catch (err) {
              throw new GraphQLError(errorHandler(err));
            }
        },
        acceptAnswer: async (_, args, context) => {
            const loggedUser = authChecker(context);
            const { quesId, ansId } = args;
      
            try {
              const question = await QuestionModel.findById(quesId);
              if (!question) {
                throw new GraphQLError(`Question with Id: ${quesId} does not exist.`);
              }
      
              const targetAnswer = question.answers.find((a) => a._id.toString() === ansId);
      
              if (!targetAnswer) {
                throw new GraphQLError(`Answer with Id: '${ansId}' does not exist.`);
              }
      
              if (question.author.toString() !== loggedUser.id.toString()) {
                throw new GraphQLError('Only the author of question can accept answers.');
              }
      
              if (!question.acceptedAnswer || !question.acceptedAnswer.equals(targetAnswer._id)) {
                question.acceptedAnswer = targetAnswer._id;
              } else {
                question.acceptedAnswer = null;
              }
      
              const savedQues = await question.save();
              const populatedQues = await savedQues.populate([{path: 'answers.author', select: 'username'}, {path: 'answers.comments.author', select: 'username'}]);
      
              return populatedQues;
            } catch (err) {
              throw new GraphQLError(errorHandler(err));
            }
        },
    },
};

export default answerResolver;