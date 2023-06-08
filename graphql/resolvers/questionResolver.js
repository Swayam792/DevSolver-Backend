import QuestionModel from "../../models/questionModel.js";
import UserModel from "../../models/userModel.js";
import authChecker from "../../helpers/authChecker.js";
import {questionValidator} from "../../helpers/validators.js";
import { GraphQLError } from 'graphql';
import errorHandler from "../../helpers/errorhandler.js";
import {paginatedResult, upvoteIt, downvoteIt, quesRep} from "../../helpers/helperFunctions.js";

const QuestionResolver = {
    Query: {
        getQuestions: async (_, args) => {
            const { sortBy, filterByTag, filterBySearch } = args;
            const page = Number(args.page);
            const limit = Number(args.limit);
            let sortQuery;
            switch(sortBy) {
                case 'VOTES':
                    sortQuery = {points: -1};
                    break;
                case 'VIEWS':
                    sortQuery = {views: -1};
                    break;
                case 'NEWEST':
                    sortQuery = {createdAt: -1};
                    break;
                case 'OLDEST':
                    sortQuery = {createdAt: 1};
                    break;
                default:
                    sortQuery = {hotAlgo: 1};
            }

            let findQuery = {};
            if(filterByTag){
                findQuery = { tags: { $all: [filterByTag]}};
            }else if(filterBySearch){
                findQuery = {
                    $or: [
                        {
                            title: {
                                $regex: filterBySearch,
                                $options: 'i'
                            }
                        }, 
                        {
                            body: {
                                $regex: filterBySearch,
                                $options: 'i'
                            }
                        }
                    ]
                }
            };

            try {
                const quesCount = await QuestionModel.find(findQuery).countDocuments();
                const paginated = paginatedResult(page, limit, quesCount);
                const questions = await QuestionModel.find(findQuery)
                .sort(sortQuery)
                .limit(limit)
                .skip(paginated.startIndex)
                .populate('author', 'username'); 
                questions.forEach((q) => {
                    q.answerCount = q.answers.length;
                })
                const paginatedQuestion = {
                    previous: paginated.results.previous,
                    questions,
                    next: paginated.results.next
                };

                return paginatedQuestion;
            }catch(err){
                throw new GraphQLError(errorHandler(err));
            }
        },
        viewQuestion: async (_, args) => {
            const { quesId } = args;

            try{
                const question = await QuestionModel.findById(quesId);
                if(!question){
                    throw new Error(`Question with ID: ${quesId} does not exist.`);
                }

                question.views++;
                const savedQues = await question.save();
                const populatedQues = await savedQues
                .populate([{path: 'author', select: 'username'}, {path: 'comments.author', select: 'username'}, {path: 'answers.author', select: 'username'}, {path: 'answers.comments.author', select: 'username'}]);
                return populatedQues;
            }catch(err) {
                throw new GraphQLError(errorHandler(err));
            }
        },
    },
    Mutation: {
        postQuestion: async (_, args, context) => {
            const loggedUser = authChecker(context);
            const { title, body, tags } = args;

            const { errors, valid } = questionValidator(title, body, tags);
            if(!valid){
                throw new GraphQLError(Object.values(errors)[0], { errors });
            }

            try {
                const author = await UserModel.findById(loggedUser.id);
                const newQuestion = new QuestionModel({
                    title,
                    body,
                    tags,
                    author: author._id
                });
                const savedQuestion = await newQuestion.save();
                const populatedQuestion = await savedQuestion.populate('author', 'username'); 
                author.questions.push({ quesId: savedQuestion._id});
                await author.save();

                return populatedQuestion;
            }catch(err){ 
                throw new GraphQLError(errorHandler(err));
            }
        },
        deleteQuestion: async (_, args, context) => {
            const loggedUser = authChecker(context);
            const { quesId } = args;

            try{
                const user = await UserModel.findById(loggedUser.id);
                const question = await QuestionModel.findById(quesId);
                if(!question){
                    throw new GraphQLError(`Question with ID: ${quesId} does not exist`);
                }

                if(question.author.toString() !== user._id.toString() && user.role !== 'ADMIN'){
                    throw new GraphQLError('You are not authorized to delete this question.');
                } 
                user.questions = user.questions.filter((q) => q.quesId.toString() !== quesId);
                await user.save();
                await QuestionModel.findByIdAndDelete(quesId);
                return question._id;
            }catch(err){
                throw new GraphQLError(errorHandler(err), 'error');
            }
        },

        editQuestion: async (_, args, context) => {
            const loggedUser = authChecker(context);
            const { quesId, title, body, tags } = args;

            const { errors, valid} = questionValidator(title, body, tags);
            if(!valid){
                throw new GraphQLError(Object.values(errors)[0], { errors });
            }

            const updatedQuesObj = { title, body, tags, updatedAt: Date.now()};

            try{
                const question = await QuestionModel.findById(quesId);
                if(!question){
                    throw new GraphQLError(
                        `Question with ID: ${quesId} does not exist in DB.`
                      );
                }

                if(question.author.toString() !== loggedUser.id){
                    throw new GraphQLError(`You are not authenticate to do this action!`);
                }

                const updatedQues = await QuestionModel.findByIdAndUpdate(quesId, updatedQuesObj, { new : true }).populate([{path: 'author', select: 'username'}, {path: 'comments.author', select: 'username'}, {path: 'answers.author', select: 'username'}, {path: 'answers.comments.author', select: 'username'}]);

                return updatedQues;
            }catch(err){
                throw new GraphQLError(errorHandler(err));
            }
        },
        voteQuestion: async (_, args, context) => {
            const loggedUser = authChecker(context);
            const { quesId, voteType } = args;

            try{
                const user = await UserModel.findById(loggedUser.id);
                const question = await QuestionModel.findById(quesId);
                if(!question){
                    throw new GraphQLError(
                        `Question with ID: ${quesId} does not exist in DB.`
                    );
                }

                if(question.author.toString() === user._id.toString()){
                    throw new GraphQLError("You can't vote for your own post.");
                }

                let votedQues;
                if(voteType === 'UPVOTE'){
                    votedQues = upvoteIt(question, user);
                }else {
                    votedQues = downvoteIt(question, user);
                }

                votedQues.hotAlgo = Math.log(Math.max(Math.abs(votedQues.points), 1)) +
                Math.log(Math.max(votedQues.views * 2, 1)) +
                votedQues.createdAt / 4500;

                const savedQues = await votedQues.save(); 
                const author = await UserModel.findById(question.author);
                const addedRepAuthor = quesRep(question, author);
                await addedRepAuthor.save();
                const populatedQues = await savedQues.populate([{path: 'author', select: 'username'}, {path: 'comments.author', select: 'username'}, {path: 'answers.author', select: 'username'}, {path: 'answers.comments.author', select: 'username'}]);
                return populatedQues;
            }catch(err) {
                throw new GraphQLError(errorHandler(err));
            }
        }
    }
};

export default QuestionResolver;