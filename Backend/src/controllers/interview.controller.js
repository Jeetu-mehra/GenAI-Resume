const { PDFParse } = require("pdf-parse")
const { generateInterviewReport, generateResumePdf, generateCoverLetterPdf } = require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")




/**
 * @description Controller to generate interview report based on user self description, resume and job description.
 */
async function generateInterViewReportController(req, res) {
    try {
        // Validate file upload
        if (!req.file) {
            return res.status(400).json({
                message: "Resume file is required. Please upload a PDF or DOCX file."
            })
        }

        // Validate form data
        const { selfDescription, jobDescription } = req.body

        if (!selfDescription && !jobDescription) {
            return res.status(400).json({
                message: "Either Job Description or Self Description is required."
            })
        }

        // Parse resume file
        let resumeContent
        try {
            const parser = new PDFParse({ data: req.file.buffer })
            resumeContent = await parser.getText()
            await parser.destroy()
            
            // Check if text extraction was successful
            if (!resumeContent.text || resumeContent.text.trim() === '') {
                return res.status(400).json({
                    message: "The PDF appears to be empty or contains no readable text. Please upload a valid resume PDF."
                })
            }
        } catch (pdfError) {
            console.error("PDF Parsing Error:", pdfError.message)
            return res.status(400).json({
                message: "Failed to parse PDF file. Please ensure the file is a valid PDF document.",
                details: pdfError.message
            })
        }

        // Generate AI report
        let interViewReportByAi
        try {
            interViewReportByAi = await generateInterviewReport({
                resume: resumeContent.text,
                selfDescription,
                jobDescription
            })
        } catch (aiError) {
            console.error("AI Service Error:", aiError.message)
            return res.status(500).json({
                message: "Failed to generate interview report. Please check your AI API configuration and try again.",
                details: aiError.message
            })
        }

        // Save to database
        const interviewReport = await interviewReportModel.create({
            user: req.user.id,
            resume: resumeContent.text,
            selfDescription,
            jobDescription,
            ...interViewReportByAi
        })

        res.status(201).json({
            message: "Interview report generated successfully.",
            interviewReport
        })

    } catch (error) {
        console.error("Error in generateInterViewReportController:", error)
        
        // Handle multer file size error
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({
                message: "File size exceeds 5MB limit. Please upload a smaller file."
            })
        }

        // Handle multer file filter error
        if (error.message.includes('only')) {
            return res.status(400).json({
                message: error.message
            })
        }

        res.status(500).json({
            message: "An error occurred while processing your resume. Please try again.",
            error: error.message
        })
    }
}

/**
 * @description Controller to get interview report by interviewId.
 */
async function getInterviewReportByIdController(req, res) {

    const { interviewId } = req.params

    const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    res.status(200).json({
        message: "Interview report fetched successfully.",
        interviewReport
    })
}


/** 
 * @description Controller to get all interview reports of logged in user.
 */
async function getAllInterviewReportsController(req, res) {
    const interviewReports = await interviewReportModel.find({ user: req.user.id }).sort({ createdAt: -1 }).select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")

    res.status(200).json({
        message: "Interview reports fetched successfully.",
        interviewReports
    })
}


/**
 * @description Controller to generate resume PDF based on user self description, resume and job description.
 */
async function generateResumePdfController(req, res) {
    try {
        const { interviewReportId } = req.params

        const interviewReport = await interviewReportModel.findById(interviewReportId)

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found."
            })
        }

        if (interviewReport.user && interviewReport.user.toString() !== req.user.id) {
            return res.status(403).json({
                message: "You are not authorized to access this interview report."
            })
        }

        const { resume, jobDescription, selfDescription } = interviewReport

        const pdfBuffer = await generateResumePdf({ resume, jobDescription, selfDescription })

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
        })

        res.send(pdfBuffer)
    } catch (error) {
        console.error("Error in generateResumePdfController:", error)
        res.status(500).json({
            message: "An error occurred while generating your resume PDF.",
            error: error.message
        })
    }
}

/**
 * @description Controller to generate cover letter PDF based on user self description, resume and job description.
 */
async function generateCoverLetterPdfController(req, res) {
    try {
        const { interviewReportId } = req.params

        const interviewReport = await interviewReportModel.findById(interviewReportId)

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found."
            })
        }

        if (interviewReport.user && interviewReport.user.toString() !== req.user.id) {
            return res.status(403).json({
                message: "You are not authorized to access this interview report."
            })
        }

        const { resume, jobDescription, selfDescription } = interviewReport

        const pdfBuffer = await generateCoverLetterPdf({ resume, jobDescription, selfDescription })

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=cover_letter_${interviewReportId}.pdf`
        })

        res.send(pdfBuffer)
    } catch (error) {
        console.error("Error in generateCoverLetterPdfController:", error)
        res.status(500).json({
            message: "An error occurred while generating your cover letter PDF.",
            error: error.message
        })
    }
}

/**
 * @description Controller to fetch aggregated analytics across all user reports.
 */
async function getInterviewAnalyticsController(req, res) {
    try {
        const reports = await interviewReportModel.find({ user: req.user.id }).sort({ createdAt: 1 })

        if (!reports.length) {
            return res.status(200).json({
                message: "No reports found for this user.",
                analytics: {
                    totalReports: 0,
                    avgMatchScore: 0,
                    highestMatchScore: 0,
                    lowestMatchScore: 0,
                    scoreTrend: [],
                    skillGaps: [],
                    strongRoles: []
                }
            })
        }

        const totalReports = reports.length
        const sumScores = reports.reduce((acc, r) => acc + (r.matchScore || 0), 0)
        const avgMatchScore = Math.round(sumScores / totalReports)

        const highestMatchScore = Math.max(...reports.map(r => r.matchScore || 0))
        const lowestMatchScore = Math.min(...reports.map(r => r.matchScore || 0))

        const scoreTrend = reports.map(r => ({
            date: r.createdAt,
            matchScore: r.matchScore,
            title: r.title
        }))

        const skillMap = {}
        reports.forEach(r => {
            if (r.skillGaps && Array.isArray(r.skillGaps)) {
                r.skillGaps.forEach(g => {
                    const skillName = g.skill.trim()
                    if (!skillMap[skillName]) {
                        skillMap[skillName] = { skill: g.skill, count: 0, severity: g.severity }
                    }
                    skillMap[skillName].count += 1
                    
                    const severityPriority = { high: 3, medium: 2, low: 1 }
                    if (severityPriority[g.severity] > severityPriority[skillMap[skillName].severity]) {
                        skillMap[skillName].severity = g.severity
                    }
                })
            }
        })

        const skillGaps = Object.values(skillMap)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)

        const strongRoles = [...reports]
            .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
            .slice(0, 3)
            .map(r => ({
                _id: r._id,
                title: r.title,
                matchScore: r.matchScore,
                createdAt: r.createdAt
            }))

        res.status(200).json({
            message: "Analytics fetched successfully.",
            analytics: {
                totalReports,
                avgMatchScore,
                highestMatchScore,
                lowestMatchScore,
                scoreTrend,
                skillGaps,
                strongRoles
            }
        })

    } catch (error) {
        console.error("Error in getInterviewAnalyticsController:", error)
        res.status(500).json({
            message: "An error occurred while calculating analytics.",
            error: error.message
        })
    }
}


/**
 * @description Controller to update preparation roadmap task progress (complete/uncomplete).
 */
async function updateTaskProgressController(req, res) {
    try {
        const { interviewReportId } = req.params
        const { day, taskIndex, completed } = req.body

        const interviewReport = await interviewReportModel.findById(interviewReportId)

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found."
            })
        }

        if (interviewReport.user && interviewReport.user.toString() !== req.user.id) {
            return res.status(403).json({
                message: "You are not authorized to edit this interview report."
            })
        }

        const taskKey = `${day}-${taskIndex}`
        
        // Initialize completedTasks array if not present
        if (!interviewReport.completedTasks) {
            interviewReport.completedTasks = []
        }

        if (completed) {
            if (!interviewReport.completedTasks.includes(taskKey)) {
                interviewReport.completedTasks.push(taskKey)
            }
        } else {
            interviewReport.completedTasks = interviewReport.completedTasks.filter(k => k !== taskKey)
        }

        await interviewReport.save()

        res.status(200).json({
            message: "Task progress updated successfully.",
            completedTasks: interviewReport.completedTasks
        })
    } catch (error) {
        console.error("Error in updateTaskProgressController:", error)
        res.status(500).json({
            message: "An error occurred while updating task progress.",
            error: error.message
        })
    }
}



/**
 * @description Controller to delete an interview report by interviewReportId.
 */
async function deleteInterviewReportController(req, res) {
    try {
        const { interviewReportId } = req.params

        const interviewReport = await interviewReportModel.findById(interviewReportId)

        if (!interviewReport) {
            return res.status(404).json({ message: "Interview report not found." })
        }

        if (interviewReport.user.toString() !== req.user.id) {
            return res.status(403).json({ message: "You are not authorized to delete this report." })
        }

        await interviewReportModel.findByIdAndDelete(interviewReportId)

        res.status(200).json({ message: "Interview report deleted successfully." })

    } catch (error) {
        console.error("Error in deleteInterviewReportController:", error)
        res.status(500).json({ message: "An error occurred while deleting the report.", error: error.message })
    }
}

module.exports = { generateInterViewReportController, getInterviewReportByIdController, getAllInterviewReportsController, generateResumePdfController, generateCoverLetterPdfController, updateTaskProgressController, getInterviewAnalyticsController, deleteInterviewReportController }