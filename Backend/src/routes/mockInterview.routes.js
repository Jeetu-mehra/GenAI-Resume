const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const mockInterviewController = require("../controllers/mockInterview.controller");

const mockInterviewRouter = express.Router();

// All routes are private and require user login
mockInterviewRouter.use(authMiddleware.authUser);

/**
 * @route POST /api/mock-interview/start
 * @description Start a new mock interview session or resume an ongoing one.
 */
mockInterviewRouter.post("/start", mockInterviewController.startInterviewSessionController);

/**
 * @route POST /api/mock-interview/session/:sessionId/message
 * @description Send candidate response message and fetch next AI interviewer question.
 */
mockInterviewRouter.post("/session/:sessionId/message", mockInterviewController.sendMessageController);

/**
 * @route POST /api/mock-interview/session/:sessionId/end
 * @description Grade the mock interview session and save the feedback scorecard.
 */
mockInterviewRouter.post("/session/:sessionId/end", mockInterviewController.endInterviewSessionController);

/**
 * @route GET /api/mock-interview/session/:sessionId
 * @description Get detail log and scorecard of a specific session.
 */
mockInterviewRouter.get("/session/:sessionId", mockInterviewController.getMockInterviewByIdController);

/**
 * @route GET /api/mock-interview/
 * @description Get all past mock interview sessions of the logged-in user.
 */
mockInterviewRouter.get("/", mockInterviewController.getUserMockInterviewsController);

module.exports = mockInterviewRouter;
