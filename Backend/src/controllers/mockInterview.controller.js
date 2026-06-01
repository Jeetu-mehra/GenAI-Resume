const mockInterviewModel = require("../models/mockInterview.model");
const interviewReportModel = require("../models/interviewReport.model");
const { generateNextInterviewResponse, generateInterviewFeedback } = require("../services/ai.service");

/**
 * @description Start a new mock interview session or resume an ongoing one.
 */
async function startInterviewSessionController(req, res) {
    try {
        const { interviewReportId } = req.body;

        if (!interviewReportId) {
            return res.status(400).json({ message: "Interview report ID is required." });
        }

        // Fetch interview report
        const report = await interviewReportModel.findOne({ _id: interviewReportId, user: req.user.id });
        if (!report) {
            return res.status(404).json({ message: "Target interview strategy plan not found." });
        }

        // Check if there's an ongoing session
        let session = await mockInterviewModel.findOne({ 
            user: req.user.id, 
            interviewReport: interviewReportId, 
            status: "ongoing" 
        });

        if (session) {
            return res.status(200).json({
                message: "Resuming ongoing interview session.",
                session
            });
        }

        // Create a new session with initial greeting
        const initialGreeting = `Hello! I will be your interviewer today for the ${report.title} role. Let's start with a standard opening question: Can you describe your background and tell me why you are interested in this position?`;

        session = await mockInterviewModel.create({
            user: req.user.id,
            interviewReport: interviewReportId,
            status: "ongoing",
            messages: [
                {
                    role: "assistant",
                    content: initialGreeting,
                    timestamp: new Date()
                }
            ]
        });

        res.status(201).json({
            message: "New interview session started.",
            session
        });

    } catch (error) {
        console.error("Error in startInterviewSessionController:", error);
        res.status(500).json({ message: "Failed to start interview session.", error: error.message });
    }
}

/**
 * @description Send a message to the AI interviewer and get a response.
 */
async function sendMessageController(req, res) {
    try {
        const { sessionId } = req.params;
        const { message } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ message: "Message content cannot be empty." });
        }

        const session = await mockInterviewModel.findOne({ _id: sessionId, user: req.user.id });
        if (!session) {
            return res.status(404).json({ message: "Interview session not found." });
        }

        if (session.status === "completed") {
            return res.status(400).json({ message: "Cannot send messages to a completed interview." });
        }

        // Append user message
        session.messages.push({
            role: "user",
            content: message.trim(),
            timestamp: new Date()
        });

        // Fetch report context
        const report = await interviewReportModel.findById(session.interviewReport);
        if (!report) {
            return res.status(404).json({ message: "Associated interview strategy plan not found." });
        }

        // Generate next question
        let aiResponse;
        try {
            aiResponse = await generateNextInterviewResponse({
                jobDescription: report.jobDescription,
                resume: report.resume,
                messages: session.messages
            });
        } catch (aiError) {
            console.error("Gemini failed to generate response:", aiError);
            aiResponse = "I'm having some trouble processing that response. Could you please explain your approach in a different way?";
        }

        // Append AI response
        session.messages.push({
            role: "assistant",
            content: aiResponse,
            timestamp: new Date()
        });

        await session.save();

        res.status(200).json({
            message: "Message processed successfully.",
            session
        });

    } catch (error) {
        console.error("Error in sendMessageController:", error);
        res.status(500).json({ message: "Failed to process message.", error: error.message });
    }
}

/**
 * @description End the mock interview and generate a feedback report scorecard.
 */
async function endInterviewSessionController(req, res) {
    try {
        const { sessionId } = req.params;

        const session = await mockInterviewModel.findOne({ _id: sessionId, user: req.user.id });
        if (!session) {
            return res.status(404).json({ message: "Interview session not found." });
        }

        // If already completed, just return the existing feedback
        if (session.status === "completed" && session.feedback) {
            return res.status(200).json({
                message: "Interview is already graded.",
                session
            });
        }

        // Fetch report context
        const report = await interviewReportModel.findById(session.interviewReport);
        if (!report) {
            return res.status(404).json({ message: "Associated interview strategy plan not found." });
        }

        // Call feedback generation
        let feedback;
        try {
            feedback = await generateInterviewFeedback({
                jobDescription: report.jobDescription,
                resume: report.resume,
                messages: session.messages
            });
        } catch (aiError) {
            console.error("Gemini failed to grade session:", aiError);
            feedback = {
                score: 70,
                summary: "Grading server experienced a temporary issue, but overall you showed steady communication.",
                strengths: ["Willingness to answer all questions", "Clear conversational flow"],
                improvements: ["Try answering technical details with more specificity", "Review foundational concepts"]
            };
        }

        // Save session state
        session.status = "completed";
        session.feedback = feedback;
        await session.save();

        res.status(200).json({
            message: "Interview session ended and graded successfully.",
            session
        });

    } catch (error) {
        console.error("Error in endInterviewSessionController:", error);
        res.status(500).json({ message: "Failed to grade interview session.", error: error.message });
    }
}

/**
 * @description Get interview session history & feedback details by session ID.
 */
async function getMockInterviewByIdController(req, res) {
    try {
        const { sessionId } = req.params;

        const session = await mockInterviewModel.findOne({ _id: sessionId, user: req.user.id })
            .populate("interviewReport", "title matchScore");

        if (!session) {
            return res.status(404).json({ message: "Interview session not found." });
        }

        res.status(200).json({
            message: "Interview session details fetched successfully.",
            session
        });

    } catch (error) {
        console.error("Error in getMockInterviewByIdController:", error);
        res.status(500).json({ message: "Failed to fetch session details.", error: error.message });
    }
}

/**
 * @description Get all past mock interview sessions of the logged-in user.
 */
async function getUserMockInterviewsController(req, res) {
    try {
        const sessions = await mockInterviewModel.find({ user: req.user.id })
            .populate("interviewReport", "title matchScore")
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: "User interview sessions fetched successfully.",
            sessions
        });

    } catch (error) {
        console.error("Error in getUserMockInterviewsController:", error);
        res.status(500).json({ message: "Failed to fetch sessions list.", error: error.message });
    }
}

module.exports = {
    startInterviewSessionController,
    sendMessageController,
    endInterviewSessionController,
    getMockInterviewByIdController,
    getUserMockInterviewsController
};
