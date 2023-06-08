import mongoose from "mongoose";
import uniqueValidator from "mongoose-unique-validator";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        minlength: 3,
        maxlength: 20,
        required: true,
        trim: true,
        unique: true,
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: 'USER'
    },
    questions: [
        {
            quesId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
            rep: { type: Number, default: 0 },
        },
    ],
    answers: [
        {
            ansId: { type: mongoose.Schema.Types.ObjectId, ref: 'Answer' },
            rep: { type: Number, default: 0 },
        },
    ]
},
  {timestamps: true}
);

userSchema.plugin(uniqueValidator);
const UserModel = mongoose.model('User', userSchema);

export default UserModel;