const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ["system", "user", "assistant"],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    _id: false
});

const mockInterviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true
    },
    interviewReport: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "InterviewReport",
        required: true
    },
    messages: [messageSchema],
    status: {
        type: String,
        enum: ["ongoing", "completed"],
        default: "ongoing"
    },
    feedback: {
        score: {
            type: Number,
            min: 0,
            max: 100
        },
        summary: String,
        strengths: [String],
        improvements: [String]
    }
}, {
    timestamps: true
});

const mockInterviewModel = mongoose.model("MockInterview", mockInterviewSchema);

module.exports = mockInterviewModel;
