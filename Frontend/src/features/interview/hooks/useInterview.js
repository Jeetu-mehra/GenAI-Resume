import { getAllInterviewReports, generateInterviewReport, getInterviewReportById, generateResumePdf, generateCoverLetterPdf, deleteInterviewReport, scrapeJobFromUrl, updateTaskProgress, getInterviewAnalytics } from "../services/interview.api"
import { useContext } from "react"
import { InterviewContext } from "../interview.context"


export const useInterview = () => {

    const context = useContext(InterviewContext)

    if (!context) {
        throw new Error("useInterview must be used within an InterviewProvider")
    }

    const { loading, setLoading, report, setReport, reports, setReports } = context

    const generateReport = async ({ jobDescription, selfDescription, resumeFile }) => {
        setLoading(true)
        try {
            const response = await generateInterviewReport({ jobDescription, selfDescription, resumeFile })
            setReport(response)
            return response
        } catch (error) {
            console.error("Error generating report:", error)
            throw error
        } finally {
            setLoading(false)
        }
    }

    const getReportById = async (interviewId) => {
        setLoading(true)
        let response = null
        try {
            response = await getInterviewReportById(interviewId)
            setReport(response.interviewReport)
        } catch (error) {
            console.log(error)
        } finally {
            setLoading(false)
        }
        return response.interviewReport
    }

    const getReports = async () => {
        setLoading(true)
        let response = null
        try {
            response = await getAllInterviewReports()
            setReports(response.interviewReports)
        } catch (error) {
            console.log(error)
        } finally {
            setLoading(false)
        }

        return response.interviewReports
    }

    const getResumePdf = async (interviewReportId) => {
        setLoading(true)
        let response = null
        try {
            response = await generateResumePdf({ interviewReportId })
            const url = window.URL.createObjectURL(new Blob([ response ], { type: "application/pdf" }))
            const link = document.createElement("a")
            link.href = url
            link.setAttribute("download", `resume_${interviewReportId}.pdf`)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)
        }
        catch (error) {
            console.log(error)
        } finally {
            setLoading(false)
        }
    }

    const getCoverLetterPdf = async (interviewReportId) => {
        setLoading(true)
        let response = null
        try {
            response = await generateCoverLetterPdf({ interviewReportId })
            const url = window.URL.createObjectURL(new Blob([ response ], { type: "application/pdf" }))
            const link = document.createElement("a")
            link.href = url
            link.setAttribute("download", `cover_letter_${interviewReportId}.pdf`)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)
        }
        catch (error) {
            console.log(error)
        } finally {
            setLoading(false)
        }
    }

    const deleteReport = async (interviewReportId) => {
        try {
            await deleteInterviewReport(interviewReportId)
            // Optimistic UI: remove from local state immediately
            setReports(prev => prev.filter(r => r._id !== interviewReportId))
        } catch (error) {
            console.error("Error deleting report:", error)
            throw error
        }
    }

    const fetchJobFromUrl = async (url) => {
        try {
            const jobDescription = await scrapeJobFromUrl(url)
            return jobDescription
        } catch (error) {
            console.error("Error scraping job URL:", error)
            throw error
        }
    }

    const toggleTaskCompletion = async (interviewReportId, day, taskIndex, completed) => {
        // Optimistically update frontend state for snappy feel
        const taskKey = `${day}-${taskIndex}`
        setReport(prev => {
            if (prev && prev._id === interviewReportId) {
                const currentCompleted = prev.completedTasks || []
                const newCompleted = completed 
                    ? [...currentCompleted, taskKey]
                    : currentCompleted.filter(k => k !== taskKey)
                return { ...prev, completedTasks: newCompleted }
            }
            return prev
        })

        try {
            const completedTasks = await updateTaskProgress({ interviewReportId, day, taskIndex, completed })
            // Set actual updated array from backend
            setReport(prev => {
                if (prev && prev._id === interviewReportId) {
                    return { ...prev, completedTasks }
                }
                return prev
            })
        } catch (error) {
            console.error("Error toggling task completion:", error)
            // Revert state on error
            setReport(prev => {
                if (prev && prev._id === interviewReportId) {
                    const currentCompleted = prev.completedTasks || []
                    const newCompleted = completed 
                        ? currentCompleted.filter(k => k !== taskKey)
                        : [...currentCompleted, taskKey]
                    return { ...prev, completedTasks: newCompleted }
                }
                return prev
            })
        }
    }

    const getAnalytics = async () => {
        setLoading(true)
        try {
            const data = await getInterviewAnalytics()
            return data
        } catch (error) {
            console.error("Error loading analytics:", error)
            throw error
        } finally {
            setLoading(false)
        }
    }


    return { loading, report, reports, generateReport, getReportById, getReports, getResumePdf, getCoverLetterPdf, deleteReport, fetchJobFromUrl, toggleTaskCompletion, getAnalytics }

}