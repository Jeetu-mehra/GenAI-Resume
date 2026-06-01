const { GoogleGenAI } = require("@google/genai")
const { z } = require("zod")
const { zodToJsonSchema } = require("zod-to-json-schema")
const puppeteer = require("puppeteer")

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
})


const interviewReportSchema = z.object({
    matchScore: z.number().describe("A score between 0 and 100 indicating how well the candidate's profile matches the job describe"),
    technicalQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Technical questions that can be asked in the interview along with their intention and how to answer them"),
    behavioralQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Behavioral questions that can be asked in the interview along with their intention and how to answer them"),
    skillGaps: z.array(z.object({
        skill: z.string().describe("The skill which the candidate is lacking"),
        severity: z.enum([ "low", "medium", "high" ]).describe("The severity of this skill gap, i.e. how important is this skill for the job and how much it can impact the candidate's chances")
    })).describe("List of skill gaps in the candidate's profile along with their severity"),
    preparationPlan: z.array(z.object({
        day: z.number().describe("The day number in the preparation plan, starting from 1"),
        focus: z.string().describe("The main focus of this day in the preparation plan, e.g. data structures, system design, mock interviews etc."),
        tasks: z.array(z.string()).describe("List of tasks to be done on this day to follow the preparation plan, e.g. read a specific book or article, solve a set of problems, watch a video etc.")
    })).describe("A day-wise preparation plan for the candidate to follow in order to prepare for the interview effectively"),
    title: z.string().describe("The title of the job for which the interview report is generated"),
})

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {


    const prompt = `You are an expert ATS (Applicant Tracking System) parser and technical recruiter.
                        Evaluate the candidate's profile against the target job description to generate a detailed interview strategy and an objective match score.

                        Inputs:
                        - Candidate Resume: ${resume || "Not provided"}
                        - Candidate Self Description: ${selfDescription || "Not provided"}
                        - Job Description: ${jobDescription}

                        Calculation Guidelines for matchScore:
                        1. Start with a baseline score based on tech stack alignment (50%), experience level alignment (30%), and educational/general qualifications (20%).
                        2. Deduct marks objectively for any detected skill gaps in the candidate's profile:
                           - Deduct 15-20% for each HIGH-severity skill gap (a critical prerequisite technology or concept specified in the job description that is missing from the resume).
                           - Deduct 5-10% for each MEDIUM-severity skill gap (a preferred, secondary requirement or tool that is missing).
                           - Deduct 2-5% for each LOW-severity skill gap (minor/nice-to-have items).
                        3. Be realistic and honest: If a candidate has major skill gaps or has a completely unrelated background, the matchScore MUST be low (e.g., under 40%). Do not inflate scores. Give a professional, accurate assessment that matches real-world recruiter screening.
                        4. Ensure that the severity of gaps listed in your 'skillGaps' field aligns with the matchScore deduction (e.g., if you list 3 high severity gaps, the match score should reflect those heavy penalties).
                    `

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-lite",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(interviewReportSchema),
        }
    })

    return JSON.parse(response.text)


}



async function generatePdfFromHtml(htmlContent) {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    })
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" })

    const pdfBuffer = await page.pdf({
        format: "A4", margin: {
            top: "20mm",
            bottom: "20mm",
            left: "15mm",
            right: "15mm"
        }
    })

    await browser.close()

    return pdfBuffer
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {

    const resumePdfSchema = z.object({
        html: z.string().describe("The HTML content of the resume which can be converted to PDF using any library like puppeteer")
    })

    const prompt = `Generate resume for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}

                        the response should be a JSON object with a single field "html" which contains the HTML content of the resume which can be converted to PDF using any library like puppeteer.
                        The resume should be tailored for the given job description and should highlight the candidate's strengths and relevant experience. The HTML content should be well-formatted and structured, making it easy to read and visually appealing.
                        The content of resume should be not sound like it's generated by AI and should be as close as possible to a real human-written resume.
                        you can highlight the content using some colors or different font styles but the overall design should be simple and professional.
                        The content should be ATS friendly, i.e. it should be easily parsable by ATS systems without losing important information.
                        The resume should not be so lengthy, it should ideally be 1-2 pages long when converted to PDF. Focus on quality rather than quantity and make sure to include all the relevant information that can increase the candidate's chances of getting an interview call for the given job description.
                    `

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-lite",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(resumePdfSchema),
        }
    })


    const jsonContent = JSON.parse(response.text)

    const pdfBuffer = await generatePdfFromHtml(jsonContent.html)

    return pdfBuffer

}

async function generateCoverLetterPdf({ resume, selfDescription, jobDescription }) {

    const coverLetterPdfSchema = z.object({
        html: z.string().describe("The HTML content of the cover letter which can be converted to PDF using any library like puppeteer")
    })

    const prompt = `Generate a professional cover letter for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}

                        the response should be a JSON object with a single field "html" which contains the HTML content of the cover letter which can be converted to PDF using any library like puppeteer.
                        The cover letter should be tailored for the given job description and should highlight the candidate's strengths and relevant experience. The HTML content should be well-formatted, structured, and visually appealing, using professional colors and typography.
                        The content of the cover letter should not sound like it's generated by AI and should be as close as possible to a real human-written cover letter.
                        The cover letter should be concise, professional, and ideally fit on a single page when converted to PDF. Focus on quality rather than quantity and make sure to include all the relevant information that can increase the candidate's chances of getting an interview call for the given job description.
                    `

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-lite",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(coverLetterPdfSchema),
        }
    })

    const jsonContent = JSON.parse(response.text)

    const pdfBuffer = await generatePdfFromHtml(jsonContent.html)

    return pdfBuffer
}

const interviewFeedbackSchema = z.object({
    score: z.number().min(0).max(100).describe("Overall rating score of the candidate's interview performance between 0 and 100"),
    summary: z.string().describe("A professional high-level summary of the candidate's performance, communication style, and technical accuracy"),
    strengths: z.array(z.string()).describe("A list of 3-5 distinct strengths demonstrated by the candidate during the interview"),
    improvements: z.array(z.string()).describe("A list of 3-5 clear, actionable areas of improvement and tips for future study")
})

async function generateNextInterviewResponse({ jobDescription, resume, messages }) {
    const chatHistoryText = messages.map(m => {
        const senderName = m.role === 'user' ? 'Candidate' : 'Interviewer';
        return `${senderName}: ${m.content}`;
    }).join("\n");

    const prompt = `You are a professional, friendly, but rigorous technical and behavioral interviewer.
                    You are conducting a live simulated interview for the following position:
                    
                    Target Job Description:
                    ${jobDescription}

                    Candidate Resume/Profile:
                    ${resume || "Not provided"}

                    Active Conversation Log:
                    ${chatHistoryText}

                    Your Goal:
                    1. Read the active conversation log above.
                    2. Generate the next logical question or response as the Interviewer.
                    3. Ask only ONE concise question at a time.
                    4. Focus on checking technical skills, project architectures, behavioral fit, and requirements listed in the job description.
                    5. Keep your tone professional, constructive, and realistic. Do not write explanations or preambles outside of the interviewer's direct words.
                    6. Respond directly as the Interviewer (e.g. "That's a solid explanation. How would you handle...") without prefixes like "Interviewer:".
                    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-lite",
        contents: prompt,
    });

    return response.text.trim();
}

async function generateInterviewFeedback({ jobDescription, resume, messages }) {
    const chatHistoryText = messages.map(m => {
        const senderName = m.role === 'user' ? 'Candidate' : 'Interviewer';
        return `${senderName}: ${m.content}`;
    }).join("\n");

    const prompt = `You are an expert technical recruiter and senior engineering manager.
                    Evaluate the candidate's responses in the interview conversation log below against the target job requirements and resume profile.
                    Provide objective, constructive feedback and an overall performance score.

                    Target Job Description:
                    ${jobDescription}

                    Candidate Resume/Profile:
                    ${resume || "Not provided"}

                    Full Interview Chat Log:
                    ${chatHistoryText}

                    Evaluate the following:
                    1. Technical accuracy: Did the candidate correctly explain core engineering concepts?
                    2. Communication clarity: Did the candidate explain details concisely and structure behavioral answers effectively (e.g., STAR method)?
                    3. Job Alignment: How well do the candidate's answers demonstrate suitability for the specific target role?
                    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-lite",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(interviewFeedbackSchema)
        }
    });

    return JSON.parse(response.text);
}

module.exports = { 
    generateInterviewReport, 
    generateResumePdf, 
    generateCoverLetterPdf,
    generateNextInterviewResponse,
    generateInterviewFeedback
}