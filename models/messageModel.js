import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true,
    },
    isSeen: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

export const MessageModel = mongoose.model('Message', messageSchema);

export default MessageModel;