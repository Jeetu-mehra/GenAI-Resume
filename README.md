# GenAI Resume

GenAI Resume is a full-stack AI interview preparation platform designed to help job seekers analyze their resume, understand job-fit, and practice technical/behavioral interviews with AI-generated guidance. The project combines a React frontend with an Express + MongoDB backend and uses Google Gemini AI to produce interview insights, personalized preparation plans, and resume/cover-letter PDF outputs.

## What this project does

This application is built around a practical hiring workflow:

1. A user creates an account and logs in.
2. The user uploads their resume and provides a job description or target role.
3. The backend analyzes the resume against the job requirements using Gemini AI.
4. The app generates:
   - an interview strategy report
   - skill-gap analysis
   - a day-wise preparation plan
   - tailored resume and cover-letter PDF content
   - mock interview questions and feedback
5. The frontend displays the results in a simple candidate dashboard and interview practice flow.

---

## Main Features

- Secure authentication using JWT-based cookies
- Resume and job-description based interview analysis
- AI-generated skill gaps and preparation roadmap
- Resume PDF and cover-letter PDF generation
- Mock interview session support
- Interview history, analytics, and saved reports
- Protected routes for authenticated users only

---

## Tech Stack

### Frontend
- React 19
- Vite
- React Router
- SCSS for styling
- Axios for API communication

### Backend
- Node.js
- Express 5
- MongoDB with Mongoose
- JWT + cookie-based authentication
- Multer for file upload handling
- PDF parsing and Puppeteer for PDF generation

### AI / Integrations
- Google GenAI (Gemini)
- Zod-based response validation
- AI-generated structured interview and resume outputs

---

## Project Structure

```text
GenAi-Resume/
├── Backend/
│   ├── server.js
│   ├── package.json
│   └── src/
│       ├── app.js
│       ├── config/
│       ├── controllers/
│       ├── middlewares/
│       ├── models/
│       ├── routes/
│       └── services/
└── Frontend/
    ├── package.json
    ├── index.html
    └── src/
        ├── App.jsx
        ├── app.routes.jsx
        ├── components/
        ├── features/
        └── style/
```

---

## Prerequisites

Before starting the app, make sure you have:

- Node.js version 18 or higher
- npm or another package manager compatible with Node
- A running MongoDB instance (local or MongoDB Atlas)
- A Google Gemini API key from Google AI Studio

---

## Backend Environment Variables

Create a file named `.env` inside the `Backend/` folder and add the following values:

```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
GOOGLE_GENAI_API_KEY=your_google_gemini_api_key
FRONTEND_URL=http://localhost:5173
```

### Variable descriptions

- `PORT`: Port used by the Express backend
- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key used for signing JWT tokens
- `GOOGLE_GENAI_API_KEY`: API key for Gemini AI
- `FRONTEND_URL`: Allowed frontend origin for CORS

---

## Installation Guide

### 1. Install backend dependencies

```bash
cd Backend
npm install
```

### 2. Install frontend dependencies

```bash
cd ../Frontend
npm install
```

---

## Running the Project

### Start the backend

```bash
cd Backend
npm run dev
```

The backend server will start on:

```text
http://localhost:3000
```

### Start the frontend

```bash
cd Frontend
npm run dev
```

The frontend development server will start on:

```text
http://localhost:5173
```

---

## API Overview

The backend exposes REST APIs under the following base paths:

- `/api/auth` — login, register, logout
- `/api/interview` — generate reports, fetch analytics, get saved reports
- `/api/scrape` — scraping-related endpoints
- `/api/mock-interview` — mock interview session support

These routes are wired in the backend application entry file and are protected where needed by authentication middleware.

---

## Typical User Flow

1. Register or log in.
2. Upload your resume PDF and enter the job description.
3. Generate an interview analysis report.
4. Review the generated skills, weaknesses, and preparation plan.
5. Generate resume or cover-letter PDF outputs if needed.
6. Practice with mock interview sessions.

---

## Notes for Development

- The backend allows the frontend origin `http://localhost:5173` by default through CORS.
- If your frontend runs on another port, update `FRONTEND_URL` in the backend `.env` file.
- This project is intended for learning, experimentation, and portfolio development.

---

## Future Improvements

Possible enhancements for this project include:

- improved resume parsing and validation
- richer analytics dashboards
- interview performance history tracking
- support for multiple AI providers
- advanced PDF export customization

---

## License

This project is for educational and development purposes.
