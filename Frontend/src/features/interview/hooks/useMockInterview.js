import { useState } from "react";
import { 
    startMockInterview, 
    sendMockMessage, 
    endMockSession, 
    getMockSessionDetails, 
    getUserMockSessions 
} from "../services/mockInterview.api";

export const useMockInterview = () => {
    const [loading, setLoading] = useState(false);
    const [session, setSession] = useState(null);
    const [messages, setMessages] = useState([]);
    const [pastSessions, setPastSessions] = useState([]);

    const startSession = async (interviewReportId) => {
        setLoading(true);
        try {
            const data = await startMockInterview({ interviewReportId });
            setSession(data);
            setMessages(data.messages || []);
            return data;
        } catch (error) {
            console.error("Error starting mock session:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const sendMessageText = async (sessionId, messageText) => {
        // Optimistic update of user message
        const tempUserMsg = {
            role: "user",
            content: messageText,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, tempUserMsg]);

        setLoading(false); // we don't block the screen, we show typing indicator in UI
        try {
            const data = await sendMockMessage({ sessionId, message: messageText });
            setSession(data);
            setMessages(data.messages || []);
            return data;
        } catch (error) {
            console.error("Error sending mock message:", error);
            // Revert state by removing optimistic message on failure
            setMessages(prev => prev.filter(m => m !== tempUserMsg));
            throw error;
        }
    };

    const endSessionGracefully = async (sessionId) => {
        setLoading(true);
        try {
            const data = await endMockSession(sessionId);
            setSession(data);
            return data;
        } catch (error) {
            console.error("Error ending mock session:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const fetchSessionDetails = async (sessionId) => {
        setLoading(true);
        try {
            const data = await getMockSessionDetails(sessionId);
            setSession(data);
            setMessages(data.messages || []);
            return data;
        } catch (error) {
            console.error("Error fetching session details:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const fetchUserSessions = async () => {
        setLoading(true);
        try {
            const data = await getUserMockSessions();
            setPastSessions(data);
            return data;
        } catch (error) {
            console.error("Error fetching user sessions:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        session,
        messages,
        pastSessions,
        startSession,
        sendMessageText,
        endSessionGracefully,
        fetchSessionDetails,
        fetchUserSessions
    };
};
