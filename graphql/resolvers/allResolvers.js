import userResolver from "./userResolver.js"; 
import QuestionResolver from "./questionResolver.js";
import QuestionCommentResolver from "./questionCommentResolver.js";
import TagResolver from "./tagResolver.js";
import answerResolver from "./answerResolver.js"; 
import ansCommentResolver from "./ansCommentResolver.js";
import pkg from 'graphql-iso-date';
const { GraphQLDateTime} = pkg;

const allResolvers = {
    Query: {
        ...QuestionResolver.Query,
        ...userResolver.Query,
        ...TagResolver.Query
    },
    Mutation: {
        ...userResolver.Mutation,
        ...QuestionResolver.Mutation,
        ...answerResolver.Mutation,
        ...QuestionCommentResolver.Mutation,
        ...ansCommentResolver.Mutation,
    },
     
    RoleType: {
        USER: 'USER',
        ADMIN: 'ADMIN',
    },
    SortByType: {
        HOT: 'HOT',
        VOTES: 'VOTES',
        VIEWS: 'VIEWS',
        NEWEST: 'NEWEST',
        OLDEST: 'OLDEST',
    },
    VoteType: {
        UPVOTE: 'UPVOTE',
        DOWNVOTE: 'DOWNVOTE',
    },
    DateTime: GraphQLDateTime,
};

export default allResolvers;