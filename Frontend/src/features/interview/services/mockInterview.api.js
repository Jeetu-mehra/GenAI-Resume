import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
    withCredentials: true,
});

/**
 * @description Service to start or resume a mock interview session.
 */
export const startMockInterview = async ({ interviewReportId }) => {
    const response = await api.post("/api/mock-interview/start", { interviewReportId });
    return response.data.session;
};

/**
 * @description Service to send a candidate response message and fetch next interviewer response.
 */
export const sendMockMessage = async ({ sessionId, message }) => {
    const response = await api.post(`/api/mock-interview/session/${sessionId}/message`, { message });
    return response.data.session;
};

/**
 * @description Service to grade mock interview session and get scorecard feedback.
 */
export const endMockSession = async (sessionId) => {
    const response = await api.post(`/api/mock-interview/session/${sessionId}/end`);
    return response.data.session;
};

/**
 * @description Service to fetch details of a specific mock session.
 */
export const getMockSessionDetails = async (sessionId) => {
    const response = await api.get(`/api/mock-interview/session/${sessionId}`);
    return response.data.session;
};

/**
 * @description Service to list all user mock interview sessions.
 */
export const getUserMockSessions = async () => {
    const response = await api.get("/api/mock-interview/");
    return response.data.sessions;
};
