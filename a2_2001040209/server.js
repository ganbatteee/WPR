import express from 'express';
import asyncHandler from 'express-async-handler'
const app = express();
import mongoose from 'mongoose';
const router = express.Router()
import cors from "cors";

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(cors());
const getRandArrNum = function (max, size) {
    const randArrNum = []
    if (!size || size === 0) {
        return;
    }
    do {
        const randNum = Math.floor(Math.random() * (max - 0 + 1) + 0)
        if (!randArrNum.includes(randNum)) { randArrNum.push(randNum) }
    } while (randArrNum.length < size)
    return randArrNum;
}
const getRandQues = function (max, size, arr) {
    const randArrQes = []
    for (const ques of getRandArrNum(max, size)) {
        randArrQes.push(arr[ques])
    }

    return randArrQes;
}
const getCorrectAns = async function (questionList) {
    const obj = {};
    for (const ques of questionList) {
        obj[ques._id] = ques.correctAnswer
    }
    return obj;
}
const checkUserAnswers = async function (userAnswers, correctAnswer) {
    let selectedRight = 0;
    // console.log(correctAnswer)
    for (const ans in userAnswers) {
        if (userAnswers[ans] === correctAnswer[ans]) {
            selectedRight++;
        }
    }

    return selectedRight;
}

const handleScoreText = (score) => {
    if (score < 5) return "Practice more to improve it :D"
    if (score >= 5 && score < 7) return "Good, keep up!"
    if (score >= 7 && score < 9) return "Well done!"
    if (score >= 9 && score <= 10) return "Perfect"
    else return ""
}
//checkpoint 1

const createAttempt = asyncHandler(async function (req, res) {
    const questions = await Question.find({})
    const questionsRandomArr = getRandQues(14, 10, questions)

    const newAttempt = new Submit({
        questions: questionsRandomArr,
        startedAt: new Date(),
        score: 0,
        completed: false
    })

    const attempt = await newAttempt.save()

    if (newAttempt) {
        res.status(201)
        res.json(attempt)
    } else {
        res.status(404)
        throw new Error('Failed to creat the attempt')
    }
});

const submit = asyncHandler(async function (req, res) {
    const id = req.params._id
    // console.log(id)
    const submit = await Submit.findById(id)
    // console.log(submit)
    const question = submit.questions
    const correctAns = await getCorrectAns(question)
    for(let i = 0; i < question.length; i++) {
        delete question[i].correctAnswer;
    }
    const userAnswers = req.body.userAnswers;

    const score = await checkUserAnswers(userAnswers, getCorrectAns)

    if (submit) {
        submit.score = score
        submit.userAnswers = userAnswers
        submit.correctAnswers = correctAns
        submit.scoreText = handleScoreText(score)
        submit.completed = true

        const submitQues = await submit.save();
        res.status(200).json(submitQues)
    }

});
const questionSchema = new mongoose.Schema({
    answers: [{
        type: String,
        required: true
    }],
    text: {
        type: String,
        required: true
    },
    correctAnswer: {
        type: Number,
        require: false
    }
})
const Question = mongoose.model("Question", questionSchema);


const submitSchema = new mongoose.Schema({
    questions: [questionSchema],
    startedAt: {
        type: Date,
        required: true
    },
    score: {
        type: Number,
        required: true,
        default: 0
    },
    userAnswers: Object,
    correctAnswers: Object,
    scoreText: {
        type: String,
        required: false
    },
    completed: {
        type: Boolean,
        required: true,
        default: true
    }
})
const Submit = mongoose.model("Submit", submitSchema)

router.route('/').post(submit)
router.route('/:id/submit').post(submit)


app.use('/attempts', createAttempt)


const DATABASE_NAME = 'wpr-quiz';
const MONGO_URL = `mongodb://localhost:27017/${DATABASE_NAME}`;

async function startServer() {
    mongoose.connect(MONGO_URL);
    console.log('Connected to db wpr-quiz')
    app.listen(3000);
    console.log('Server listening on port 3000');
}
startServer();