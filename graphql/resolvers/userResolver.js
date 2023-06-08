import UserModel from "../../models/userModel.js";
import QuestionModel from "../../models/questionModel.js"; 
import jwt from 'jsonwebtoken';
import bcrypt from "bcrypt";
import { registerValidator, loginValidator } from "../../helpers/validators.js";
import { GraphQLError } from 'graphql';
import errorHandler from "../../helpers/errorhandler.js";
import "dotenv/config.js";

const userResolver = {
    Query: {
      getUser: async (_,args) => {
        const {username} = args; 
        if(username.trim() === ''){
            throw new GraphQLError('Username should not be empty!');
        }

        const user = await UserModel.findOne({
            username: { $regex: new RegExp("^" + username + "$"), $options: 'i'}
        });

        if(!user){
            throw new GraphQLError(`User ${username} not found!`);
        }
        try{
            const recentQuestions = await QuestionModel.find({
                author: user._id
            })
            .sort({ createdAt: -1})
            .select('id title points createdAt')
            .limit(5);
    
            const recentAnswers = await QuestionModel.find({
                answers: { $elemMatch: { author: user._id } },
            })
            .sort({ createdAt: -1 })
            .select('id title points createdAt')
            .limit(5);
            
            return {
                id: user._id,
                username: user.username,
                role: user.role,
                totalQuestions: user.questions.length,
                totalAnswers: user.answers.length,
                createdAt: user.createdAt,
                recentQuestions,
                recentAnswers
            };
        } catch (err){
            throw new GraphQLError(errorHandler(err));
        }         
      },
      getAllUsers: async () => {
        const allUsers = await UserModel.find({})
        .select('username createdAt');
        return allUsers;
      }
    },
    Mutation: {        
        register: async (_, args) => { 
            const {username, password} = args;
            const { errors, valid } = registerValidator(username, password);

            if(!valid){
                throw new GraphQLError(Object.values(errors)[0], { errors });
            }

            const existingUser = await UserModel.findOne({
                username: { $regex: new RegExp("^" + username + "$"), $options: 'i'}
            });

            if(existingUser){
                throw new GraphQLError(`Username ${username} not found!`);
            }

            const salt = 10;
            const passwordHash = await bcrypt.hash(password, salt);

            const user = new UserModel({
                username, password: passwordHash
            });

            const registeredUser = await user.save();
            const token = jwt.sign({
                id: registeredUser._id,
            }, process.env.TOKEN_SECRET);

            return {
                id: registeredUser._id,
                username: registeredUser.username,
                role: registeredUser.role,
                token
            };
        },

        login: async (_, args) => {
            const {username, password} = args; 
            const { errors, valid } = loginValidator(username, password); 
            if(!valid){
                new GraphQLError(Object.values(errors)[0], { errors });
            } 
            const nuser = await UserModel.findOne({
                username: username
            }); 
            const user = await UserModel.findOne({
                username: { $regex: new RegExp("^" + username + "$"), $options: 'i'}
            }); 

            if(!user){
                throw new GraphQLError(`User ${username} not found!`);
            }

            const isCredentialValid = await bcrypt.compare(password, user.password);

            if(!isCredentialValid){
                throw new GraphQLError('Username or password is incorrect.');
            }

            const token = jwt.sign({
                id: user._id
            }, process.env.TOKEN_SECRET);

            return {
                id: user._id,
                username: user.username,
                role: user.role,
                token
            }
        }
    }
}

export default userResolver;