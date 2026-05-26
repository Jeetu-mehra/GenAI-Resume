import axios from "axios"


const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
    withCredentials: true
})

export async function register({ username, email, password }) {
    try {
        const response = await api.post('/api/auth/register', {
            username, email, password
        })
        return response.data
    } catch (err) {
        console.error("Register API error:", err)
        throw new Error(err.response?.data?.message || "Registration failed. Please try again.")
    }
}

export async function login({ email, password }) {
    try {
        const response = await api.post("/api/auth/login", {
            email, password
        })
        return response.data
    } catch (err) {
        console.error("Login API error:", err)
        throw new Error(err.response?.data?.message || "Login failed. Please try again.")
    }
}

export async function logout() {
    try {
        const response = await api.get("/api/auth/logout")
        return response.data
    } catch (err) {
        console.error("Logout API error:", err)
        throw new Error(err.response?.data?.message || "Logout failed.")
    }
}

export async function getMe() {
    try {
        const response = await api.get("/api/auth/get-me")
        return response.data
    } catch (err) {
        if (err.response?.status === 401) {
            return { user: null }
        }
        console.error("GetMe API error:", err)
        throw new Error(err.response?.data?.message || "Failed to fetch user session.")
    }
}