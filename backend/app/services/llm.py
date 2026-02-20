import os
import json
from groq import Groq
from typing import Dict, Any, List
from dotenv import load_dotenv


class RoadmapLLMService:
    def __init__(self):
        """Initialize Groq client with API key from environment"""
        load_dotenv()
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY environment variable is required")
        self.client = Groq(api_key=api_key)

    async def generate_roadmap_content(self, skill: str, timeframe: str, current_knowledge: str, target_level: str) -> Dict[Any, Any]:
        """Generate personalized roadmap content using Groq LLM"""
        prompt = f"""
I need a personalized roadmap for learning {skill} within {timeframe}.
My current knowledge level is {current_knowledge}, and I'd like to reach a {target_level} level of proficiency.

Please create a hierarchical learning path with:
- hashes [varname] nodename
- Single hash (#) for {skill}
- Double hash (##) for time periods (day/week/month divisions)
- Triple hash (###) for specific learning topics
- Quadruple hash (####) for optional subtopics where needed

EXAMPLE --FOLLOW THIS FORMAT STRICTLY MAXIMUM DOUBLE HASH MUST BE 6 AND TRY AVOIDING QUADRUPLE HASHES LESS -MAXIMUM 4:

# [root] js
## [a1] Week 1
### [a11] JavaScript Refresher
#### [a111] Variables and Data Types

NOTE:
1.total number of quadruple hashes should be 4 or less. use it when the subtopic is actually required.
2.total number of double hashes should be 6 or less.
3.keep the node names short and concise.
4.Please ensure the roadmap is comprehensive yet realistic and simple for my {timeframe} timeline and builds logically from my current knowledge level to my desired proficiency.
5.Do not include any introductory text, explanatory notes, headers, or concluding remarks in your response.
6.DOUBLE CHECK IF THE ROADMAP IS OF PROPER SYNTAX
7.Make sure the time nodes are properly divided.
"""

        try:
            response = self.client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert learning path designer. Generate the output EXACTLY in the specified format, customized for the given skill."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                model="llama-3.3-70b-versatile",
                temperature=0.7,
                max_tokens=2048
            )
            content = response.choices[0].message.content

            # Split sections based on '---'
            sections = content.strip().split('---')
            mermaid_section = sections[0].strip() if len(sections) > 0 else ''

            return {
                "success": True,
                "data": {
                    "mermaid": mermaid_section.strip(),
                    "descriptions": ""
                }
            }

        except Exception as e:
            print(f"Error generating roadmap content: {str(e)}")
            return {
                "success": False,
                "error": f"Failed to generate roadmap content: {str(e)}"
            }

    async def generate_quiz_for_topic(self, topic: str, skill: str = None, level: str = None, num_questions: int = 5, difficulty: str = "medium") -> Dict[str, Any]:
        """Generate a multiple-choice quiz for a given topic."""
        skill_part = f"Main skill: {skill}.\n" if skill else ""
        level_part = f"Learner level: {level}.\n" if level else ""

        prompt = f"""
Generate a {num_questions}-question multiple-choice quiz for the topic: {topic}.
{skill_part}{level_part}
Return ONLY a JSON object with a top-level key `questions` that is an array of question objects.
Each question object must have: `question` (string), `options` (array of 3-5 strings), `answer_index` (0-based integer), and `explanation` (short string).
Do not include any additional text, markdown, or commentary outside the JSON.
Difficulty: {difficulty}.
"""

        try:
            response = self.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are a helpful quiz generator. Output must be valid JSON as specified."},
                    {"role": "user", "content": prompt}
                ],
                model="llama-3.3-70b-versatile",
                temperature=0.7,
                max_tokens=800
            )

            content = response.choices[0].message.content.strip()

            try:
                parsed = json.loads(content)
            except Exception:
                start = content.find('{')
                end = content.rfind('}')
                if start != -1 and end != -1 and end > start:
                    try:
                        parsed = json.loads(content[start:end + 1])
                    except Exception as e:
                        return {"success": False, "error": f"Failed to parse LLM JSON: {str(e)}", "raw": content}
                else:
                    return {"success": False, "error": "No JSON found in LLM response", "raw": content}

            return {"success": True, "data": parsed}

        except Exception as e:
            print(f"Error generating quiz: {str(e)}")
            return {"success": False, "error": f"Failed to generate quiz: {str(e)}"}

    async def generate_job_recommendations(self, skills: List[str], levels: List[str] = None, num_jobs: int = 6) -> Dict[str, Any]:
        """
        Generate job recommendations using LLM for any skill.
        Falls back gracefully if the LLM call fails.
        """
        skills_str = ", ".join(skills)
        levels_str = ""
        if levels:
            skill_level_pairs = [f"{s} ({l})" for s, l in zip(skills, levels)]
            levels_str = "\nProficiency levels: " + ", ".join(skill_level_pairs)

        prompt = f"""
Generate {num_jobs} realistic job recommendations for someone with the following skills:
Skills: {skills_str}{levels_str}

Return ONLY a JSON object with a top-level key `jobs` that is an array of job objects.
Each job object must have:
- `title` (string): Job title
- `company` (string): Company name (can be fictional but realistic)
- `description` (string): Brief job description (2-3 sentences)
- `required_skills` (array): List of required skills from the provided skills
- `salary_range` (string): Expected salary range in INR (e.g., "₹5,00,000 - ₹8,00,000")
- `job_type` (string): Full-time, Part-time, Contract, or Remote
- `level` (string): Entry-level, Mid-level, or Senior

Do not include any additional text, markdown, or commentary outside the JSON.
Make the recommendations realistic and achievable with the provided skill set.
"""

        try:
            response = self.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are a helpful job recommendation engine. Output must be valid JSON as specified."},
                    {"role": "user", "content": prompt}
                ],
                model="llama-3.3-70b-versatile",
                temperature=0.7,
                max_tokens=2000
            )

            content = response.choices[0].message.content.strip()

            try:
                parsed = json.loads(content)
            except Exception:
                start = content.find('{')
                end = content.rfind('}')
                if start != -1 and end != -1 and end > start:
                    try:
                        parsed = json.loads(content[start:end + 1])
                    except Exception as e:
                        return {"success": False, "error": f"Failed to parse LLM JSON: {str(e)}", "raw": content}
                else:
                    return {"success": False, "error": "No JSON found in LLM response", "raw": content}

            return {"success": True, "data": parsed}

        except Exception as e:
            print(f"Error generating job recommendations: {str(e)}")
            return {"success": False, "error": f"Failed to generate job recommendations: {str(e)}"}


# Create singleton instance
llm_service = RoadmapLLMService()