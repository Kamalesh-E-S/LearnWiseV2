# LearnWise

LearnWise is a personalized learning roadmap platform that helps users create, manage, and track their custom learning paths. It combines AI-powered roadmap generation with interactive quizzes and job recommendations based on completed skills.

## Features

### Core Features
- **Custom Roadmaps**: Generate personalized learning paths tailored to your goals, current knowledge, and preferred timeframe using AI
- **Visual Flowchart**: Interactive roadmap visualization using React Flow
- **Progress Tracking**: Monitor your learning journey with visual progress indicators and completion milestones
- **Node Management**: Mark nodes as completed, view detailed descriptions, and access curated learning resources
- **Quiz System**: Auto-generated quizzes for each topic with scoring and attempt tracking
- **Job Recommendations**: Get real-time job recommendations based on your completed skills
- **Resource Links**: Access curated YouTube videos and website links for each learning topic
- **Authentication**: Secure login and signup with JWT authentication

## Tech Stack

### Frontend
- **React** - UI framework
- **React Router** - Routing and navigation
- **ReactFlow** - Interactive flowchart visualization
- **Zustand** - Lightweight state management
- **Tailwind CSS** - Utility-first styling
- **Axios** - HTTP client
- **Lucide React** - Icon library

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM for database operations
- **SQLite** - Lightweight database
- **Groq LLM** - AI-powered roadmap and quiz generation
- **JWT** - Authentication and authorization
- **Pydantic** - Data validation

## Installation

### Prerequisites
- Node.js (v16+) and npm
- Python 3.9+
- Git

### API Keys Required
You'll need to obtain API keys from:
- **Groq API** - For roadmap and quiz generation (https://console.groq.com)
- **Google Custom Search API** - For website link recommendations
- **YouTube Data API** - For video recommendations

### Backend Setup

1. Clone the repository:
```bash
git clone https://github.com/Kamalesh-E-S/LearnWiseV2.git
cd LearnWiseV2/backend
```

2. Create a virtual environment:
```bash
python -m venv venv

# On Windows:
venv\Scripts\activate

# On macOS/Linux:
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create `.env` file in `backend/` directory:
```
GROQ_API_KEY=your_groq_api_key
GOOGLE_API_KEY=your_google_api_key
CX_ID=your_google_cx_id
YOUTUBE_API_KEY=your_youtube_api_key
JSEARCH_API_KEY=your_jsearch_api_key (optional)
```

5. Run the backend server:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: `http://localhost:8000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file in `frontend/` directory:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start development server:
```bash
npm run dev
```

Frontend will be available at: `http://localhost:5173`

## Usage

### Creating a Roadmap

1. **Sign up/Login** - Register an account or log in
2. **Create Roadmap** - Click "Create Roadmap" and fill in:
   - **Skill**: What you want to learn (e.g., "Python", "React")
   - **Timeframe**: Duration (e.g., "3 months", "6 weeks")
   - **Current Knowledge**: Your baseline (e.g., "Beginner", "Intermediate")
   - **Target Level**: Your goal (e.g., "Advanced", "Expert")
3. **AI Generation** - The system generates a hierarchical learning path
4. **Track Progress** - Mark nodes as completed, view resources, take quizzes

### Taking Quizzes

1. Click on any learning node
2. Click "Take Quiz" button
3. Answer multiple-choice questions
4. Get instant feedback with score and explanations
5. Need 80% to pass and mark the node as complete

### Exploring Job Opportunities

1. Complete learning roadmaps
2. Navigate to "Jobs" section
3. View personalized job recommendations based on your learned skills
4. See job details, required skills, and salary ranges

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile

### Roadmaps
- `POST /api/roadmap/create` - Create new roadmap
- `GET /api/roadmap/ongoing` - Get ongoing roadmaps
- `GET /api/roadmap/completed` - Get completed roadmaps
- `GET /api/roadmap/{roadmap_id}` - Get specific roadmap
- `PUT /api/roadmap/{roadmap_id}/mark-node` - Mark node as complete
- `PUT /api/roadmap/{roadmap_id}/progress` - Update roadmap progress
- `GET /api/roadmap/jobs/recommendations` - Get job recommendations

### Quizzes
- `POST /api/quizzes/generate` - Generate quiz for a topic
- `GET /api/quizzes/attempts` - Get quiz attempts for a node
- `POST /api/quizzes/submit` - Submit quiz answers

## Project Structure

```
LearnWiseV2/
├── backend/
│   ├── app/
│   │   ├── auth/
│   │   │   ├── routes.py
│   │   │   └── security.py
│   │   ├── routes/
│   │   │   ├── roadmap.py
│   │   │   ├── quizzes.py
│   │   ├── services/
│   │   │   ├── llm.py
│   │   │   ├── resources.py
│   │   │   └── jobs.py
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   └── database.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth.jsx
│   │   │   ├── Quiz.jsx
│   │   │   ├── Jobs.jsx
│   │   │   ├── RoadmapViewer.jsx
│   │   │   └── ...
│   │   ├── store/
│   │   │   ├── authStore.js
│   │   │   └── roadmapStore.js
│   │   ├── lib/
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Key Features Explained

### AI-Powered Roadmap Generation
Uses Groq LLM to generate hierarchical learning paths with:
- Time-based breakdowns (weeks, months)
- Progressive difficulty levels
- Logical skill progression

### Automatic Quiz Generation
Quizzes are dynamically created for each topic with:
- 5 questions per topic
- Multiple choice format
- Difficulty adjustment based on skill level
- 80% passing threshold

### Smart Job Matching
Job recommendations based on:
- Completed roadmaps
- Learned skills
- Career progression matching
- Real company data integration

## Contributing

Feel free to contribute by:
1. Forking the repository
2. Creating a feature branch
3. Committing your changes
4. Pushing to the branch
5. Opening a pull request

## License

This project is open source and available under the MIT License.

## Acknowledgments

- **Groq** - For powerful LLM capabilities
- **ReactFlow** - For flowchart visualization
- **FastAPI** - For the backend framework
- **Tailwind CSS** - For styling utilities
- **Lucide React** - For beautiful icons

## Support

For issues, questions, or suggestions, please open an issue on GitHub or contact the maintainers.

---

**Happy Learning with LearnWise! 🚀**
