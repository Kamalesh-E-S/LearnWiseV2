import requests
import json
from typing import List, Dict, Any
from dotenv import load_dotenv
import os

load_dotenv()

class JobsService:
    def __init__(self):
        """Initialize jobs service"""
        # You can use various job APIs:
        # - JSearch API (RapidAPI)
        # - Indeed API
        # - LinkedIn API
        # - Custom Naukri scraping
        self.jsearch_api_key = os.getenv("JSEARCH_API_KEY")
        self.jsearch_host = "jsearch.p.rapidapi.com"

    async def fetch_jobs_from_naukri(self, skills: List[str], num_jobs: int = 6) -> Dict[str, Any]:
        """
        Fetch job recommendations from Naukri-like sources based on skills.
        Uses a combination of APIs and mock data.
        """
        try:
            jobs = []
            
            # For now, we'll use mock data that represents Naukri jobs
            # In production, you would integrate with actual Naukri API or web scraping
            for skill in skills[:3]:  # Limit to top 3 skills
                naukri_jobs = await self._get_naukri_jobs_for_skill(skill)
                jobs.extend(naukri_jobs)
            
            # Sort by relevance and return top N
            jobs = jobs[:num_jobs]
            
            return {
                "success": True,
                "data": {
                    "jobs": jobs
                }
            }
        
        except Exception as e:
            print(f"Error fetching jobs: {str(e)}")
            return {
                "success": False,
                "error": f"Failed to fetch jobs: {str(e)}"
            }

    async def _get_naukri_jobs_for_skill(self, skill: str) -> List[Dict[str, Any]]:
        """
        Fetch jobs for a specific skill from Naukri sources.
        This is a mock implementation - replace with actual API calls.
        """
        # Naukri job listings based on skill
        # Mock data representing real Naukri jobs
        naukri_jobs_db = {
            "Python": [
                {
                    "title": "Python Developer",
                    "company": "TCS (Tata Consultancy Services)",
                    "description": "Develop and maintain Python-based applications. Work with Django/Flask frameworks and handle RESTful APIs.",
                    "required_skills": ["Python", "Django", "REST API"],
                    "salary_range": "₹4,00,000 - ₹7,00,000",
                    "job_type": "Full-time",
                    "level": "Mid-level"
                },
                {
                    "title": "Senior Python Engineer",
                    "company": "Infosys",
                    "description": "Lead Python development projects, mentor junior developers, and architect scalable solutions.",
                    "required_skills": ["Python", "System Design", "Leadership"],
                    "salary_range": "₹8,00,000 - ₹12,00,000",
                    "job_type": "Full-time",
                    "level": "Senior"
                },
                {
                    "title": "Data Engineer - Python",
                    "company": "ICICI Bank",
                    "description": "Build data pipelines and analytics solutions using Python. Work with big data technologies.",
                    "required_skills": ["Python", "SQL", "Data Engineering"],
                    "salary_range": "₹6,00,000 - ₹9,00,000",
                    "job_type": "Full-time",
                    "level": "Mid-level"
                }
            ],
            "React": [
                {
                    "title": "React Frontend Developer",
                    "company": "Flipkart",
                    "description": "Build responsive UIs with React, work on e-commerce platforms, optimize performance.",
                    "required_skills": ["React", "JavaScript", "CSS"],
                    "salary_range": "₹5,00,000 - ₹8,00,000",
                    "job_type": "Full-time",
                    "level": "Mid-level"
                },
                {
                    "title": "Senior React Developer",
                    "company": "Swiggy",
                    "description": "Lead frontend development, architect component libraries, mentor team members.",
                    "required_skills": ["React", "TypeScript", "Web Performance"],
                    "salary_range": "₹9,00,000 - ₹13,00,000",
                    "job_type": "Full-time",
                    "level": "Senior"
                },
                {
                    "title": "React Native Developer",
                    "company": "Byju's",
                    "description": "Develop cross-platform mobile apps with React Native for iOS and Android.",
                    "required_skills": ["React Native", "JavaScript", "Mobile Development"],
                    "salary_range": "₹4,50,000 - ₹7,50,000",
                    "job_type": "Full-time",
                    "level": "Mid-level"
                }
            ],
            "JavaScript": [
                {
                    "title": "Full Stack JavaScript Developer",
                    "company": "Oyo Rooms",
                    "description": "Build full-stack applications with Node.js and React. Work on real-time features.",
                    "required_skills": ["JavaScript", "Node.js", "React"],
                    "salary_range": "₹4,00,000 - ₹7,00,000",
                    "job_type": "Full-time",
                    "level": "Mid-level"
                },
                {
                    "title": "JavaScript Developer",
                    "company": "Amazon",
                    "description": "Develop scalable web applications, optimize JavaScript code, work on performance.",
                    "required_skills": ["JavaScript", "Web Development", "Performance"],
                    "salary_range": "₹8,00,000 - ₹12,00,000",
                    "job_type": "Full-time",
                    "level": "Senior"
                },
                {
                    "title": "Junior JavaScript Developer",
                    "company": "Accenture",
                    "description": "Start your career as a JavaScript developer, work with mentors, learn best practices.",
                    "required_skills": ["JavaScript", "HTML", "CSS"],
                    "salary_range": "₹2,50,000 - ₹4,00,000",
                    "job_type": "Full-time",
                    "level": "Entry-level"
                }
            ],
            "TypeScript": [
                {
                    "title": "TypeScript Developer",
                    "company": "Microsoft",
                    "description": "Develop type-safe applications with TypeScript, contribute to open-source projects.",
                    "required_skills": ["TypeScript", "JavaScript", "OOP"],
                    "salary_range": "₹7,00,000 - ₹10,00,000",
                    "job_type": "Full-time",
                    "level": "Mid-level"
                },
                {
                    "title": "Senior TypeScript Engineer",
                    "company": "Google",
                    "description": "Design and implement large-scale TypeScript projects, lead architecture decisions.",
                    "required_skills": ["TypeScript", "System Design", "Leadership"],
                    "salary_range": "₹12,00,000 - ₹18,00,000",
                    "job_type": "Full-time",
                    "level": "Senior"
                }
            ],
            "Web Development": [
                {
                    "title": "Web Developer",
                    "company": "HCL Technologies",
                    "description": "Develop responsive websites and web applications using modern technologies.",
                    "required_skills": ["HTML", "CSS", "JavaScript"],
                    "salary_range": "₹3,00,000 - ₹5,00,000",
                    "job_type": "Full-time",
                    "level": "Entry-level"
                },
                {
                    "title": "Senior Web Developer",
                    "company": "Goldman Sachs",
                    "description": "Lead web development initiatives, architect scalable solutions, mentor developers.",
                    "required_skills": ["Web Development", "System Design", "Leadership"],
                    "salary_range": "₹10,00,000 - ₹15,00,000",
                    "job_type": "Full-time",
                    "level": "Senior"
                }
            ],
            "Machine Learning": [
                {
                    "title": "ML Engineer",
                    "company": "Databricks",
                    "description": "Build machine learning models, work with large datasets, deploy ML solutions.",
                    "required_skills": ["Machine Learning", "Python", "Data Science"],
                    "salary_range": "₹6,00,000 - ₹9,00,000",
                    "job_type": "Full-time",
                    "level": "Mid-level"
                },
                {
                    "title": "Senior ML Researcher",
                    "company": "DeepMind",
                    "description": "Research and develop advanced ML algorithms, publish papers, lead research initiatives.",
                    "required_skills": ["Machine Learning", "Research", "Leadership"],
                    "salary_range": "₹12,00,000 - ₹18,00,000",
                    "job_type": "Full-time",
                    "level": "Senior"
                }
            ],
            "Data Science": [
                {
                    "title": "Data Scientist",
                    "company": "McKinsey",
                    "description": "Analyze data, build predictive models, provide business insights.",
                    "required_skills": ["Data Science", "Python", "SQL"],
                    "salary_range": "₹5,00,000 - ₹8,00,000",
                    "job_type": "Full-time",
                    "level": "Mid-level"
                }
            ],
            "Node.js": [
                {
                    "title": "Node.js Backend Developer",
                    "company": "Netflix",
                    "description": "Build scalable backend services with Node.js, optimize API performance.",
                    "required_skills": ["Node.js", "JavaScript", "REST API"],
                    "salary_range": "₹6,00,000 - ₹9,00,000",
                    "job_type": "Full-time",
                    "level": "Mid-level"
                }
            ]
        }
        
        # Get jobs for the skill, default to generic web development jobs
        skill_lower = skill.lower()
        jobs = naukri_jobs_db.get(skill, [])
        
        # If no exact match, try partial matching
        if not jobs:
            for key in naukri_jobs_db.keys():
                if skill_lower in key.lower() or key.lower() in skill_lower:
                    jobs = naukri_jobs_db.get(key, [])
                    break
        
        # If still no jobs, return generic tech jobs
        if not jobs:
            jobs = naukri_jobs_db.get("Web Development", [])[:2]
        
        return jobs

# Create singleton instance
jobs_service = JobsService()
