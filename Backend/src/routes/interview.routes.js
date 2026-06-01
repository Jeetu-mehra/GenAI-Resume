const express = require("express")
const authMiddleware = require("../middlewares/auth.middleware")
const interviewController = require("../controllers/interview.controller")
const upload = require("../middlewares/file.middleware")

const interviewRouter = express.Router()



/**
 * @route POST /api/interview/
 * @description generate new interview report on the basis of user self description,resume pdf and job description.
 * @access private
 */
interviewRouter.post("/", authMiddleware.authUser, upload.single("resume"), interviewController.generateInterViewReportController)

/**
 * @route GET /api/interview/analytics
 * @description get interview report analytics for logged in user.
 * @access private
 */
interviewRouter.get("/analytics", authMiddleware.authUser, interviewController.getInterviewAnalyticsController)


/**
 * @route GET /api/interview/report/:interviewId
 * @description get interview report by interviewId.
 * @access private
 */
interviewRouter.get("/report/:interviewId", authMiddleware.authUser, interviewController.getInterviewReportByIdController)


/**
 * @route GET /api/interview/
 * @description get all interview reports of logged in user.
 * @access private
 */
interviewRouter.get("/", authMiddleware.authUser, interviewController.getAllInterviewReportsController)


/**
 * @route POST /api/interview/resume/pdf/:interviewReportId
 * @description generate resume pdf on the basis of user self description, resume content and job description.
 * @access private
 */
interviewRouter.post("/resume/pdf/:interviewReportId", authMiddleware.authUser, interviewController.generateResumePdfController)


/**
 * @route POST /api/interview/cover-letter/pdf/:interviewReportId
 * @description generate cover letter pdf on the basis of user self description, resume content and job description.
 * @access private
 */
interviewRouter.post("/cover-letter/pdf/:interviewReportId", authMiddleware.authUser, interviewController.generateCoverLetterPdfController)


/**
 * @route PATCH /api/interview/:interviewReportId/task
 * @description update task checklist progress (complete/uncomplete).
 * @access private
 */
interviewRouter.patch("/:interviewReportId/task", authMiddleware.authUser, interviewController.updateTaskProgressController)


/**
 * @route DELETE /api/interview/:interviewReportId
 * @description delete an interview report by interviewReportId.
 * @access private
 */
interviewRouter.delete("/:interviewReportId", authMiddleware.authUser, interviewController.deleteInterviewReportController)



module.exports = interviewRouter