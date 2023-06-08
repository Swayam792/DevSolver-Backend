import mongoose from "mongoose";
import "dotenv/config"

const connectDB = async () => {
   try{ 
      mongoose.connect(process.env.MONGO_URL);
      console.log(`MongoDB Connected!`);
   }catch(err){
     console.log(err);
   }
}

export default connectDB;