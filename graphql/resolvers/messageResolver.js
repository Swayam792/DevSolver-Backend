import authChecker from "../../helpers/authChecker.js";
import MessageModel from "../../models/messageModel.js";
import UserModel from "../../models/userModel.js"
import { PubSub } from 'graphql-subscriptions';
import errorHandler from "../../helpers/errorhandler.js";
import pkg from 'graphql';
const {GraphQLError} = pkg;

const pubsub = new PubSub();

const messageResolver = {
    Query: {
        getMessages: async (_, args, context) => {
            const loggedUser = authChecker(context);
            const { userId } = args; 
            if(!loggedUser){
                throw new GraphQLError('You are not logged in.');
            }

            const receiverUser = await UserModel.findById(userId);
            if(!receiverUser){
                throw new GraphQLError('Receiver not found.');
            }
            
            try {
                const messages = await MessageModel.find({
                    $or: [
                        {
                            sender: loggedUser.id,
                            receiver: userId
                        },
                        {
                            sender: userId,
                            receiver: loggedUser.id
                        }
                    ]
                }).populate([{path: 'sender', select: "username"}, {path: 'receiver', select: "username"}]);
                return messages;
            }catch(err){
                throw new GraphQLError(errorHandler(err));
            }
        },
        getAllMessages: async (_, args, context) => {
            const loggedUser = authChecker(context);
            if(!loggedUser){
                throw new GraphQLError('You are not logged in.');
            }
            try {
                const messages = await MessageModel.find({
                    $or: [
                        { sender: loggedUser.id },
                        { receiver: loggedUser.id}
                    ]
                }).select('sender receiver').populate([{path: 'sender', select: "username"}, {path: 'receiver', select: "username"}]);
                return messages;
            } catch (err){
                throw new GraphQLError(errorHandler(err));
            }
        },
        getUnseenMessageCount: async (_, args, context) => {
            const loggedUser = authChecker(context); 
            if(!loggedUser){ 
                throw new GraphQLError('You are not logged in.');
            }
 
            try { 
                let user = await UserModel.findById(loggedUser.id).select("id"); 
                const messages = await MessageModel.aggregate([
                    {
                        $match: {                            
                            receiver: user._id,
                            isSeen: false                           
                        }
                    },
                    {
                        $group: {
                            _id: "$sender",
                            sender: {
                                $first: "$sender"
                            },
                            count: { $sum: 1 }
                        }
                    }
                ]);
                let message = messages.map((a) => {
                    return {id: a._id.toString(), sender: a.sender.toString(), count: a.count};
                }); 
                return message;
            }catch (err) {
                console.log(err);
                throw new GraphQLError(errorHandler(err));
            }
        }
    },
    Mutation : {
        sendMessage: async (_, args, context) => {
            const loggedUser = authChecker(context);
            const { receiver, content } = args;

            if(!loggedUser){
                throw new GraphQLError('User not logged in.');
            }

            if(content.trim() === ""){
                throw new GraphQLError('Message content cannot be empty.');
            }

            try {
                const message = await MessageModel.create({
                    sender: loggedUser.id,
                    receiver: receiver,
                    content: content
                });
                const populatedMessage = await message.populate([{path: 'sender', select: "username"}, {path: 'receiver', select: "username"}]);
                pubsub.publish('NEW_MESSAGE',{
                    newMessage: populatedMessage
                });
                pubsub.publish('WHOLE_NEW_MESSAGE', {
                    wholeNewMessage: populatedMessage.sender
                });
                return populatedMessage;
            }catch(err){
                throw new GraphQLError(errorHandler(err));
            }
        },
        markSeenMessage: async (_, args, context) => {
            const loggedUser = authChecker(context); 
            const {sender} = args; 
            if(!loggedUser){ 
                throw new GraphQLError('You are not logged in.');
            }
            if(!sender){
                throw new GraphQLError('No sender found.');
            }
            try{
                const updatedMessage = await MessageModel.updateMany({sender}, {
                    $set: { isSeen: true}
                });
                return {
                    success: 1,
                    message: "Data updated!"
                };
            } catch(err){
                throw new GraphQLError(errorHandler(err));
            }     
        }
    },
    Subscription: {
        newMessage: {
            subscribe: async (_, newMessage) => { 
                return pubsub.asyncIterator(['NEW_MESSAGE'])
            }
            ,
            resolve: (payload) => {  
                return payload.newMessage;
            },
        },
        wholeNewMessage: {
            subscribe: async (_, wholeNewMessage) => {
                return pubsub.asyncIterator(['WHOLE_NEW_MESSAGE'])
            },
            resolve: (payload) => { 
                return payload.wholeNewMessage
            }
        }
    }
}

export default messageResolver;