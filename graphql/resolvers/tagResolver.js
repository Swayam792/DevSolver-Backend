import { GraphQLError } from "graphql";
import QuestionModel from "../../models/questionModel.js";
import errorHandler from "../../helpers/errorhandler.js";

const TagResolver = {
    Query: {
        getAllTags: async () => {
            try{
                const tagsFromQues = await QuestionModel.find({}).
                select('tags');
                const tagsArray = tagsFromQues.map((t) => t.tags).flat();

                let result = [];
                tagsArray.forEach((tag) => {
                    const found = result.find((r) => r.tagName === tag);

                    if(found){
                        result[result.indexOf(found)].count++;
                    }else{
                        result.push({tagName: tag, count: 1});
                    }
                });

                return result.sort((a, b) => b.count > a.count);
            }catch(err){
                throw new GraphQLError(errorHandler(err));
            }
        }
    }
}   

export default TagResolver;