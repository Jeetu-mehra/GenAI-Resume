import { createBrowserRouter } from "react-router";
import Login from "./features/auth/pages/Login";
import Register from "./features/auth/pages/Register";
import Protected from "./features/auth/components/Protected";
import Layout from "./components/Layout";
import Home from "./features/interview/pages/Home";
import Interview from "./features/interview/pages/Interview";
import MockInterviewSession from "./features/interview/pages/MockInterviewSession";


export const router = createBrowserRouter([
    {
        path: "/login",
        element: <Login />
    },
    {
        path: "/register",
        element: <Register />
    },
    {
        element: <Protected><Layout /></Protected>,
        children: [
            {
                path: "/",
                element: <Home />
            },
            {
                path: "/interview/:interviewId",
                element: <Interview />
            },
            {
                path: "/interview/:interviewId/mock",
                element: <MockInterviewSession />
            }
        ]
    }
])