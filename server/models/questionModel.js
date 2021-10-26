import mongoose from 'mongoose';

const questionSchema = mongoose.Schema({
    question: { type: String, required: true },
    answer: { type: String, required: true },
    answerArr: [{ type: String }],
}, { timestamps: true })

const Question = mongoose.model('Question', questionSchema);

export default Question;