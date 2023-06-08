import userResolver from "./userResolver.js"; 
import QuestionResolver from "./questionResolver.js";
import QuestionCommentResolver from "./questionCommentResolver.js";
import TagResolver from "./tagResolver.js";
import answerResolver from "./answerResolver.js"; 
import ansCommentResolver from "./ansCommentResolver.js";
import pkg from 'graphql-iso-date';
import messageResolver from "./messageResolver.js";
const { GraphQLDateTime} = pkg;

const allResolvers = {
    Query: {
        ...QuestionResolver.Query,
        ...userResolver.Query,
        ...TagResolver.Query,
        ...messageResolver.Query
    },
    Mutation: {
        ...userResolver.Mutation,
        ...QuestionResolver.Mutation,
        ...answerResolver.Mutation,
        ...QuestionCommentResolver.Mutation,
        ...ansCommentResolver.Mutation,
        ...messageResolver.Mutation
    },
    Subscription: {
        ...messageResolver.Subscription
    },

    QuestionList: {
        answerCount: (parent) => parent.answers.length,
    },
    User: {
        reputation: (parent) => { 
          const questionRep = parent.questions.reduce((sum, q) => sum + q.rep, 0);
          const answerRep = parent.answers.reduce((sum, a) => sum + a.rep, 0);
          return 1 + questionRep + answerRep;
        },
        totalQuestions: (parent) => { 
            return parent.questions.length
        },
        totalAnswers: (parent) => parent.answers.length,
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