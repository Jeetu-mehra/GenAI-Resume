# GenAI Resume - AI-Powered Interview Preparation Platform

An intelligent web application that leverages Google's GenAI API to analyze resumes, match candidates with job descriptions, and generate personalized interview preparation plans with practice questions and skill gap analysis.

## 🌟 Features

### Core Functionality
- **Resume Analysis**: Upload and parse PDF resumes using AI-powered analysis
- **Job Matching**: Compare candidate profiles with job descriptions to generate match scores
- **Interview Preparation**: 
  - Generate technical interview questions tailored to the job
  - Generate behavioral interview questions
  - Provide comprehensive answers and talking points
- **Skill Gap Analysis**: Identify missing skills with severity levels (low, medium, high)
- **Personalized Preparation Plan**: Get a day-by-day study plan to prepare for interviews
- **PDF Report Generation**: Generate detailed interview preparation reports as PDFs

### User Features
- **Authentication**: Secure user registration and login with JWT tokens
- **Resume Storage**: Store and manage multiple resumes
- **Interview History**: View past interview reports and analysis
- **Protected Routes**: All interview data is user-specific and protected

## 🛠️ Tech Stack

### Backend
- **Node.js** & **Express.js** - Server framework
- **MongoDB** & **Mongoose** - Database and ODM
- **Google GenAI** - AI/ML capabilities for interview preparation
- **JWT** & **bcryptjs** - Authentication and password hashing
- **Multer** - File upload handling
- **PDF-Parse** - PDF text extraction
- **Puppeteer** - PDF generation and web automation
- **Zod** - Schema validation

### Frontend
- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **SASS/SCSS** - Styling
- **ESLint** - Code quality

## 📋 Project Structure

```
GenAi-Resume/
├── Backend/                           # Node.js/Express API
│   ├── package.json                   # Dependencies & scripts
│   ├── server.js                      # Entry point
│   └── src/
│       ├── app.js                     # Express app configuration
│       ├── config/
│       │   └── database.js            # MongoDB connection
│       ├── controllers/
│       │   ├── auth.controller.js     # Authentication logic
│       │   └── interview.controller.js # Interview report generation
│       ├── middlewares/
│       │   ├── auth.middleware.js     # JWT verification
│       │   └── file.middleware.js     # File upload handling
│       ├── models/
│       │   ├── user.model.js          # User schema
│       │   ├── blacklist.model.js     # Token blacklist for logout
│       │   └── interviewReport.model.js # Interview report schema
│       ├── routes/
│       │   ├── auth.routes.js         # Auth endpoints
│       │   └── interview.routes.js    # Interview endpoints
│       └── services/
│           └── ai.service.js          # Google GenAI integration
│
├── Frontend/                          # React Vite application
│   ├── package.json                   # Dependencies & scripts
│   ├── vite.config.js                 # Vite configuration
│   ├── eslint.config.js               # ESLint rules
│   ├── index.html                     # HTML entry point
│   └── src/
│       ├── main.jsx                   # React entry point
│       ├── App.jsx                    # Main component
│       ├── app.routes.jsx             # Route definitions
│       ├── style.scss                 # Global styles
│       └── features/
│           ├── auth/                  # Authentication feature
│           │   ├── auth.context.jsx   # Auth state management
│           │   ├── auth.form.scss     # Auth form styles
│           │   ├── hooks/
│           │   │   └── useAuth.js     # Auth hook
│           │   ├── services/
│           │   │   └── auth.api.js    # Auth API calls
│           │   └── pages/
│           │       ├── Login.jsx      # Login page
│           │       └── Register.jsx   # Register page
│           ├── interview/             # Interview feature
│           │   ├── interview.context.jsx # Interview state
│           │   ├── hooks/
│           │   │   └── useInterview.js # Interview hook
│           │   ├── services/
│           │   │   └── interview.api.js # Interview API calls
│           │   ├── pages/
│           │   │   ├── Home.jsx       # Home/dashboard page
│           │   │   └── Interview.jsx  # Interview page
│           │   └── style/
│           │       ├── home.scss      # Home page styles
│           │       └── interview.scss # Interview page styles
│           └── ai/                    # AI features
│
└── README.md                          # This file
```

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v16 or higher)
- **npm** or **yarn** package manager
- **MongoDB** (local or cloud - MongoDB Atlas)
- **Google GenAI API Key** (get from Google AI Studio)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd GenAi-Resume
   ```

2. **Setup Backend**
   ```bash
   cd Backend
   npm install
   ```

3. **Setup Frontend**
   ```bash
   cd ../Frontend
   npm install
   cd ..
   ```

### Environment Configuration

Create a `.env` file in the `Backend` directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRY=7d

# Google GenAI Configuration
GOOGLE_GENAI_API_KEY=your_google_genai_api_key_here

# CORS Configuration
FRONTEND_URL=http://localhost:5173
```

**Getting API Keys:**
- **Google GenAI API Key**: Visit [Google AI Studio](https://aistudio.google.com/app/apikey), create a new API key, and copy it
- **MongoDB URI**: Use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) for a cloud database or setup local MongoDB

## 🏃 Running the Application

### Start Backend Server
```bash
cd Backend
npm run dev
```
The API will be available at `http://localhost:5000`

### Start Frontend Development Server
```bash
cd Frontend
npm run dev
```
The application will be available at `http://localhost:5173`

### Production Build
```bash
# Frontend build
cd Frontend
npm run build

# Backend uses Node directly
node server.js
```

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}

Response: 201 Created
{
  "message": "User registered successfully",
  "user": { "id": "...", "email": "..." }
}
```

#### Login User
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}

Response: 200 OK
{
  "message": "Login successful",
  "token": "jwt_token_here"
}
```

#### Logout User
```
POST /api/auth/logout
Authorization: Bearer <jwt_token>

Response: 200 OK
{
  "message": "Logged out successfully"
}
```

### Interview Endpoints

#### Generate Interview Report
```
POST /api/interview/generate-report
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data

Form Data:
- file: <PDF resume file>
- selfDescription: "Brief description of your background and experience"
- jobDescription: "Job description from the job posting"

Response: 201 Created
{
  "interviewReport": {
    "_id": "...",
    "matchScore": 85,
    "technicalQuestions": [
      {
        "question": "...",
        "intention": "...",
        "answer": "..."
      },
      ...
    ],
    "behavioralQuestions": [
      {
        "question": "...",
        "intention": "...",
        "answer": "..."
      },
      ...
    ],
    "skillGaps": [
      {
        "skill": "...",
        "severity": "high|medium|low"
      },
      ...
    ],
    "preparationPlan": [
      {
        "day": 1,
        "focus": "...",
        "tasks": ["...", "..."]
      },
      ...
    ]
  }
}
```

#### Get Interview Reports
```
GET /api/interview/reports
Authorization: Bearer <jwt_token>

Response: 200 OK
{
  "reports": [
    {
      "_id": "...",
      "matchScore": 85,
      "createdAt": "2024-05-25T10:30:00Z",
      ...
    }
  ]
}
```

#### Download Report as PDF
```
GET /api/interview/report/:reportId/pdf
Authorization: Bearer <jwt_token>

Response: 200 OK (PDF file)
```

## 🔐 Authentication

The application uses JWT (JSON Web Tokens) for authentication:
- Tokens are issued upon successful login and stored in HTTP-only cookies
- Protected routes verify the token via the auth middleware
- Tokens expire after 7 days (configurable)
- Logout adds tokens to a blacklist to prevent reuse

## 🧠 How AI-Powered Interview Preparation Works

1. **Resume Analysis**: The system parses your PDF resume to extract key information
2. **Job Matching**: Compares your profile against the job description using AI
3. **Question Generation**: 
   - Generates technical questions specific to the job requirements
   - Creates behavioral questions based on job role
   - Provides detailed answers with key talking points
4. **Skill Assessment**: Identifies gaps between your skills and job requirements
5. **Preparation Strategy**: Creates a personalized study plan to address skill gaps

## 🔄 File Upload & Processing

- **Supported Format**: PDF
- **Max File Size**: 10MB (configurable)
- **Processing**: PDF is parsed to extract text using pdf-parse
- **Storage**: PDF content is stored in MongoDB for future reference

## 🐛 Development

### Running Tests
```bash
cd Backend
npm test
```

### Linting
```bash
# Frontend
cd Frontend
npm run lint

# Fix lint errors
npm run lint -- --fix
```

### Code Style
- Backend: Node.js/Express conventions
- Frontend: React best practices, ESLint rules

## 📝 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `MONGODB_URI` | MongoDB connection string | mongodb+srv://user:pass@cluster.mongodb.net/db |
| `JWT_SECRET` | Secret key for JWT signing | your_secret_key |
| `JWT_EXPIRY` | JWT token expiration time | 7d |
| `GOOGLE_GENAI_API_KEY` | Google GenAI API key | AIzaSy... |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:5173 |

## 🤝 Contributing

1. Create a feature branch (`git checkout -b feature/AmazingFeature`)
2. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
3. Push to the branch (`git push origin feature/AmazingFeature`)
4. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Troubleshooting

### MongoDB Connection Issues
- Ensure your IP is whitelisted in MongoDB Atlas
- Check the connection string in `.env`
- Verify MongoDB is running (if using local MongoDB)

### Google GenAI API Errors
- Verify API key is valid and active
- Check API usage limits in Google Cloud Console
- Ensure API is enabled in your Google Cloud project

### CORS Errors
- Confirm `FRONTEND_URL` in backend `.env` matches frontend URL
- Check that credentials flag is set to `true` in CORS config

### Port Already in Use
- Backend: Change PORT in `.env` or kill process using port 5000
- Frontend: Vite will use next available port, or specify: `npm run dev -- --port 3000`

## 📞 Support

For issues or questions, please open an issue on GitHub or contact the development team.

---

**Happy Interview Prep! 🎉**
