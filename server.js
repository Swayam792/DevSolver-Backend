import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from '@apollo/server/standalone';
import connectDB from "./config/db.js";
import "dotenv/config.js";
import typeDefs from "./graphql/typeDefs.js"; 
import allResolvers from "./graphql/resolvers/allResolvers.js"; 
import pkg from 'lodash';
const { merge } = pkg;

const PORT = process.env.PORT || 4000;

connectDB();

const server = new ApolloServer({
    typeDefs,
    resolvers: allResolvers
});

// console.log(allResolvers.userResolver.Query.getAllUsers)
const { url } = await startStandaloneServer(server, {
    listen: {port : PORT},
    context: ({req}) => ({req})
});

console.log(`Server running at ${url}`);