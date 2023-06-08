import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from '@apollo/server/standalone';
import { expressMiddleware } from '@apollo/server/express4';
import connectDB from "./config/db.js";
import "dotenv/config.js";
import typeDefs from "./graphql/typeDefs.js"; 
import allResolvers from "./graphql/resolvers/allResolvers.js"; 
import express from 'express';
import { createServer } from 'http';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import bodyParser from 'body-parser';
import cors from 'cors';

const PORT = process.env.PORT | 4000;

connectDB();

const schema = makeExecutableSchema({ typeDefs, resolvers: allResolvers });

const app = express();
const httpServer = createServer(app);

const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
});

const context = (ctx) => ctx;

const serverCleanup = useServer({ schema }, wsServer);

const server = new ApolloServer({
  schema, 
  plugins: [ 
    ApolloServerPluginDrainHttpServer({ httpServer }),
 
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          },
        };
      },
    },
  ],
});

// console.log(allResolvers.userResolver.Query.getAllUsers)
// const { url } = await startStandaloneServer(server, {
//     listen: {port : PORT},
//     context: ({req}) => ({req})
// });

// console.log(`Server running at ${url}`);


await server.start();
app.use('/graphql', cors(), bodyParser.json(), expressMiddleware(server, {context}));

httpServer.listen(PORT, () => {
    console.log(`Server is now running on http://localhost:${PORT}/graphql`);
});