import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
    withCredentials: true,
})


/**
 * @description Service to generate interview report based on user self description, resume and job description.
 */
export const generateInterviewReport = async ({ jobDescription, selfDescription, resumeFile }) => {
    try {
        // Validate inputs
        if (!resumeFile && !selfDescription) {
            throw new Error("Please provide either a resume file or a self-description to generate your interview strategy.")
        }

        if (!jobDescription) {
            throw new Error("Job description is required to generate your interview strategy.")
        }

        // Validate file if provided
        if (resumeFile) {
            const maxFileSize = 5 * 1024 * 1024 // 5MB
            if (resumeFile.size > maxFileSize) {
                throw new Error("Resume file exceeds 5MB limit. Please upload a smaller file.")
            }

            const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
            const fileExtension = resumeFile.name.toLowerCase().substring(resumeFile.name.lastIndexOf('.'))
            
            if (!allowedTypes.includes(resumeFile.type) && !['.pdf', '.docx'].includes(fileExtension)) {
                throw new Error("Only PDF and DOCX files are supported. Please upload a valid file.")
            }
        }

        const formData = new FormData()
        formData.append("jobDescription", jobDescription)
        formData.append("selfDescription", selfDescription)
        if (resumeFile) {
            formData.append("resume", resumeFile)
        }

        const response = await api.post("/api/interview/", formData, {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        })

        return response.data.interviewReport

    } catch (error) {
        // Handle axios errors
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message)
        }
        
        // Handle client-side validation errors
        if (error.message) {
            throw new Error(error.message)
        }

        throw new Error("Failed to generate interview report. Please try again.")
    }
}


/**
 * @description Service to get interview report by interviewId.
 */
export const getInterviewReportById = async (interviewId) => {
    const response = await api.get(`/api/interview/report/${interviewId}`)

    return response.data
}


/**
 * @description Service to get all interview reports of logged in user.
 */
export const getAllInterviewReports = async () => {
    const response = await api.get("/api/interview/")

    return response.data
}


/**
 * @description Service to generate resume pdf based on user self description, resume content and job description.
 */
export const generateResumePdf = async ({ interviewReportId }) => {
    const response = await api.post(`/api/interview/resume/pdf/${interviewReportId}`, null, {
        responseType: "blob"
    })

    return response.data
}


/**
 * @description Service to delete an interview report by interviewReportId.
 */
export const deleteInterviewReport = async (interviewReportId) => {
    const response = await api.delete(`/api/interview/${interviewReportId}`)
    return response.data
}


/**
 * @description Service to scrape a job description from a given URL.
 */
export const scrapeJobFromUrl = async (url) => {
    const response = await api.post("/api/scrape/job", { url })
    return response.data.jobDescription
}