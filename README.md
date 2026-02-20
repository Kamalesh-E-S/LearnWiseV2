# LearnWise

LearnWise is a premium, AI-powered personalized learning roadmap platform that helps users create, manage, and track custom learning paths. It combines intelligent roadmap generation, interactive quizzes, real-time job scraping from LinkedIn and Naukri, and a polished editorial UI — all in one cohesive platform.

---

## ✨ What's New (Latest Update)

### 🎨 Premium Editorial UI Redesign
The entire frontend has been restyled with a cohesive, premium editorial theme:
- **Parchment background** (`#fcfaf7`) applied globally
- **Playfair Display** serif font for all headings, **Inter** for body text
- **Coral** (`#ff7f50`) as the primary accent colour across buttons, progress bars, icons, and badges
- **Sage** (`#f4f7f4`) for input fields, card interiors, and hover states
- **Midnight** (`#1a202c`) for primary text and the nav/header bar
- `rounded-3xl` cards with hover-lift (`-translate-y-1`) and shadow animations throughout
- Glassmorphism navbar with `backdrop-blur`

**Components restyled:** `Home`, `App` layout, `Auth`, `RoadmapForm`, `OngoingRoadmaps`, `CompletedRoadmaps`, `Jobs`, `Profile`, `Sidebar`, `NodeInfo`, `Quiz`

---

### 💼 Real Job Recommendation System (via python-jobspy + MCP)

The job system is now powered by **live scraping** — no AI-generated fake jobs.

**Architecture:**
```
GET /jobs/recommendations  or  POST /jobs/search
           │
           ▼
    JobsService (async)
           │
    asyncio.gather()
    ┌──────┴──────┐
    │             │
LinkedIn       Naukri
(real listings) (real listings)
    │             │
    └──────┬──────┘
           │
     Scoring Engine
     ┌─────────────────────────────┐
     │  40%  Skill keyword match   │
     │  30%  Skill in job title    │
     │  20%  Seniority match       │
     │  10%  Location match        │
     └─────────────────────────────┘
           │
     Top-N ranked jobs (with real job_url)
```

**FastMCP server** (`src/mcp_server.py`) — exposes scraping as MCP tools:
```python
from mcp.server.fastmcp import FastMCP
from src.job_api import fetch_linkedin_jobs, fetch_naukri_jobs

mcp = FastMCP("Job Recommender")

@mcp.tool()
async def fetchlinkedin(listofkey): ...

@mcp.tool()
async def fetchnaukri(listofkey): ...

if __name__ == "__main__":
    mcp.run(transport='stdio')
```

**Key improvements:**
- Jobs sourced from **all roadmaps** (ongoing + completed), not just completed ones
- **Free-form skill search** — any user can search any skill, even without a roadmap
- **10 popular skill quick-chips** (Python, React, ML, DevOps, etc.)
- Clickable **required-skill tags** on job cards trigger a new search
- **Source badge** on every card (🔵 LinkedIn / 🟠 Naukri)
- **"Apply Now"** button links directly to the real job posting URL
- **Scoring & deduplication** — results ranked by relevance, duplicates removed
- Users with no roadmaps auto-search "Software Engineer" to always see real listings

---

### 🧪 Quiz Modal Rethemed
- Midnight header with Playfair Display title
- Sage background for question area with coral radio selection
- Progress bar (coral) tracks question position
- Result screen: coral `CheckCircle` for pass, red `XCircle` for fail
- Inline answer review with explanations
- "Retake (new questions)" generates a fresh quiz

---

## Features

### Core Features
- **Custom Roadmaps** — AI-generated hierarchical learning paths tailored to your skill, timeframe, and current level
- **Visual Flowchart** — Interactive roadmap visualization using React Flow
- **Progress Tracking** — Progress bars, completion milestones, and stats on the profile page
- **Node Management** — Mark nodes complete, view descriptions, access curated resources
- **Quiz System** — Auto-generated multiple-choice quizzes per topic; 80% threshold to pass
- **Real Job Recommendations** — Live-scraped listings from LinkedIn and Naukri, ranked by skill match
- **Free-form Job Search** — Search any skill or role; available to all users regardless of roadmap status
- **Resource Links** — Curated YouTube videos and website links for every learning topic
- **Authentication** — Secure JWT login/signup with bcrypt password hashing
- **Profile Page** — View stats, change password, manage account

---

## Tech Stack

### Frontend
| Library | Purpose |
|---|---|
| React + Vite | UI framework & dev server |
| React Router | Routing and navigation |
| ReactFlow | Interactive flowchart visualization |
| Zustand | Global state management |
| Tailwind CSS v3 | Utility-first styling with custom design tokens |
| Axios | HTTP client |
| Lucide React | Icon library |
| Google Fonts (Inter + Playfair Display) | Typography |

### Backend
| Library | Purpose |
|---|---|
| FastAPI | Modern async Python web framework |
| SQLAlchemy + SQLite | ORM and lightweight database |
| Groq LLM (`llama-3.3-70b-versatile`) | Roadmap and quiz generation |
| python-jobspy | Real job scraping from LinkedIn & Naukri |
| mcp[cli] + FastMCP | MCP server for exposing job tools |
| JWT + bcrypt | Authentication and password security |
| Pydantic | Request/response data validation |
| python-dotenv | Environment variable management |

### Design System Tokens (Tailwind)
```js
colors: {
  midnight:  '#1a202c',   // primary text, dark elements
  coral:     '#ff7f50',   // accent: buttons, progress, icons
  sage:      '#f4f7f4',   // inputs, card interiors, hover
  parchment: '#fcfaf7',   // global page background
}
fontFamily: {
  sans:  ['Inter', 'sans-serif'],
  serif: ['"Playfair Display"', 'serif'],
}
```

---

## Installation

### Prerequisites
- Node.js v18+ and npm/pnpm
- Python 3.10+
- Git

### API Keys Required
| Key | Purpose | Source |
|---|---|---|
| `GROQ_API_KEY` | Roadmap + quiz generation | https://console.groq.com |
| `GOOGLE_API_KEY` | Website resource links | Google Cloud Console |
| `CX_ID` | Google Custom Search | Google Programmable Search |
| `YOUTUBE_API_KEY` | Video resource links | Google Cloud Console |

### Backend Setup

1. Clone the repository:
```bash
git clone https://github.com/Kamalesh-E-S/LearnWiseV2.git
cd LearnWiseV2/backend
```

2. Create a virtual environment:
```bash
python -m venv venv

# Windows:
venv\Scripts\activate

# macOS/Linux:
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create `.env` file in `backend/app/`:
```env
GROQ_API_KEY=your_groq_api_key
GOOGLE_API_KEY=your_google_api_key
CX_ID=your_google_cx_id
YOUTUBE_API_KEY=your_youtube_api_key
```

5. Start the backend:
```bash
uvicorn app.main:app --reload
```

Backend runs at: `http://localhost:8000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
pnpm install   # or: npm install
```

3. Start development server:
```bash
pnpm run dev   # or: npm run dev
```

Frontend runs at: `http://localhost:5173`

### (Optional) Run MCP Job Server standalone
```bash
cd backend
python src/mcp_server.py
```

---

## Usage

### Creating a Roadmap
1. **Sign up / Login** — Register or log in
2. **Create Roadmap** — Click "Create Roadmap" and fill in:
   - **Skill** — What you want to learn (e.g., "Python", "React")
   - **Timeframe** — Duration (e.g., "3 months", "6 weeks")
   - **Current Knowledge** — Your baseline (e.g., "Beginner", "Intermediate")
   - **Target Level** — Your goal (e.g., "Advanced", "Expert")
3. **AI Generation** — A hierarchical learning path is generated
4. **Track Progress** — Mark nodes complete, view resources, take quizzes

### Taking Quizzes
1. Click any learning node in the roadmap
2. Click **"Take Quiz"**
3. Answer 5 multiple-choice questions
4. Get instant feedback with score breakdown and explanations
5. **80% correct** required to pass and mark the node complete
6. Retake with fresh questions if needed

### Exploring Jobs
1. Navigate to **"Jobs"** from the sidebar
2. Jobs from **all your roadmaps** (ongoing + completed) load automatically
3. Use the **search bar** to find jobs for any skill (e.g., "DevOps", "Machine Learning")
4. Click **popular skill chips** for quick searches
5. Click any **required-skill tag** on a card to search that skill
6. Hit **"Apply Now"** to open the real LinkedIn or Naukri listing

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/signup` | Register new user |
| `POST` | `/api/auth/login` | Login and receive JWT token |
| `GET` | `/api/auth/me` | Get current user profile |

### Roadmaps
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/roadmap/create` | Create new AI-generated roadmap |
| `GET` | `/api/roadmap/ongoing` | Get ongoing roadmaps |
| `GET` | `/api/roadmap/completed` | Get completed roadmaps |
| `GET` | `/api/roadmap/{roadmap_id}` | Get specific roadmap |
| `PUT` | `/api/roadmap/{roadmap_id}/mark-node` | Mark a node as complete |
| `PUT` | `/api/roadmap/{roadmap_id}/progress` | Update roadmap progress |
| `DELETE` | `/api/roadmap/{roadmap_id}` | Delete a roadmap |

### Jobs
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/roadmap/jobs/recommendations` | Live jobs from all roadmaps (LinkedIn + Naukri, ranked) |
| `POST` | `/api/roadmap/jobs/search` | Search jobs by any skill `{ "skill": "..." }` |

### Quizzes
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/quizzes/generate` | Generate quiz for a topic |
| `GET` | `/api/quizzes/attempts` | Get quiz attempts for a node |
| `POST` | `/api/quizzes/submit` | Submit quiz answers and record score |

---

## Project Structure

```
A10/
├── backend/
│   ├── app/
│   │   ├── auth/
│   │   │   ├── routes.py          # JWT login/signup endpoints
│   │   │   └── security.py        # bcrypt + token utilities
│   │   ├── routes/
│   │   │   ├── roadmap.py         # Roadmap + job endpoints
│   │   │   └── quizzes.py         # Quiz endpoints
│   │   ├── services/
│   │   │   ├── llm.py             # Groq LLM: roadmap + quiz generation
│   │   │   ├── resources.py       # YouTube + website resource links
│   │   │   └── jobs.py            # Job scoring, ranking, scraper orchestration
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   └── database.py
│   ├── src/
│   │   ├── job_api.py             # python-jobspy scrapers (LinkedIn + Naukri)
│   │   └── mcp_server.py          # FastMCP server exposing job tools
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Home.jsx           # Landing page (hero, features, CTA)
│   │   │   ├── Auth.jsx           # Login / signup
│   │   │   ├── RoadmapForm.jsx    # Roadmap creation form
│   │   │   ├── OngoingRoadmaps.jsx
│   │   │   ├── CompletedRoadmaps.jsx
│   │   │   ├── Jobs.jsx           # Real job listings + search
│   │   │   ├── Profile.jsx        # User profile + stats
│   │   │   ├── Sidebar.jsx        # Roadmap topic navigation
│   │   │   ├── NodeInfo.jsx       # Node detail panel + resources
│   │   │   └── Quiz.jsx           # Quiz modal
│   │   ├── store/
│   │   │   ├── authStore.js
│   │   │   └── roadmapStore.js
│   │   ├── lib/
│   │   │   └── axios.js
│   │   ├── App.jsx                # Routing + shared Layout
│   │   └── index.css              # Global styles + Tailwind directives
│   ├── tailwind.config.js         # Custom tokens (midnight, coral, sage, parchment)
│   ├── index.html                 # Google Fonts CDN links
│   └── vite.config.js
└── README.md
```

---

## Key Features Deep Dive

### AI-Powered Roadmap Generation
Uses `llama-3.3-70b-versatile` via Groq to produce a structured Mermaid-like outline with:
- Single root node (the skill)
- Up to 6 time-period nodes (weeks/months)
- Topic nodes under each period
- Optional subtopic nodes (≤4)
- Parsed into React Flow nodes and edges client-side

### Automatic Quiz Generation
Each topic quiz is dynamically created with:
- 5 multiple-choice questions per topic
- Difficulty adjusted to current node level
- 80% passing threshold
- Answer explanations included
- Fresh questions on retake (`force_new=true`)

### Real Job Scraping + Smart Scoring
All jobs are live-scraped from **LinkedIn** and **Naukri** using `python-jobspy`:

```python
# Concurrent scraping
linkedin_jobs, naukri_jobs = await asyncio.gather(
    loop.run_in_executor(None, fetch_linkedin_jobs, skills, location, limit),
    loop.run_in_executor(None, fetch_naukri_jobs,  skills, location, limit),
)
```

Each job then receives a weighted relevance score:
| Dimension | Weight | Method |
|---|---|---|
| Skill keyword match | 40% | Regex search across description + title |
| Skill in job title | 30% | Exact keyword in title |
| Seniority level match | 20% | Entry / Mid / Senior alignment |
| Location match | 10% | City/country string contains check |

Top-N results returned after deduplication by title+company.

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/your-feature`)
3. Commit your changes (`git commit -m 'feat: add your feature'`)
4. Push the branch (`git push origin feat/your-feature`)
5. Open a pull request

---

## License

This project is open source and available under the **MIT License**.

---

## Acknowledgments

- **Groq** — High-speed LLM inference
- **python-jobspy** — Multi-board job scraping (LinkedIn, Naukri, Indeed, Glassdoor)
- **FastMCP** — MCP server framework for tool exposure
- **ReactFlow** — Flowchart visualization
- **FastAPI** — Modern async Python web framework
- **Tailwind CSS** — Utility-first styling
- **Lucide React** — Beautiful icon set
- **Google Fonts** — Inter + Playfair Display typography

---

**Happy Learning with LearnWise! 🚀**
