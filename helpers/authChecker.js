import { GraphQLError } from "graphql";
import jwt from "jsonwebtoken";
import "dotenv/config";

const authChecker = (context) => {
    const token = context.req.headers.authorization;
    if(!token){
        throw new GraphQLError('No auth token provided.');
    }

    try{
        const decodedUser = jwt.verify(token, process.env.TOKEN_SECRET);
        return decodedUser;
    } catch(err){
        throw new GraphQLError('Invalid/Expired token.');
    }
}

export default authChecker;