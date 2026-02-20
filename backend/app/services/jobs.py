"""
app/services/jobs.py

Real job recommendation service — NO AI-generated fallback.
  1. Fetches concurrently from LinkedIn + Naukri via python-jobspy
  2. Scores every job across four dimensions:
       - Skill match     (40 %)
       - Title relevance (30 %)
       - Level match     (20 %)
       - Location bonus  (10 %)
  3. Returns top-N ranked jobs — all with real job_url links
  4. If scrapers return nothing, raises a clear error (no fake data)
"""
from __future__ import annotations

import asyncio
import re
import sys
import os
import traceback
from typing import Any

# ── locate the real scrapers ─────────────────────────────────────────────────
_BACKEND_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _BACKEND_ROOT not in sys.path:
    sys.path.insert(0, _BACKEND_ROOT)

from src.job_api import fetch_linkedin_jobs, fetch_naukri_jobs


# ── Scoring helpers ───────────────────────────────────────────────────────────

def _skill_score(job: dict, skills: list[str]) -> float:
    """0.0–1.0: fraction of queried skills found in description + title."""
    if not skills:
        return 0.5
    haystack = job.get("_full_description", "") + " " + job.get("_title_lower", "")
    hits = sum(
        1 for s in skills
        if re.search(r'\b' + re.escape(s.lower()) + r'\b', haystack)
    )
    return hits / len(skills)


def _title_score(job: dict, skills: list[str]) -> float:
    """1.0 if any skill keyword appears in the job title, else 0.2."""
    title = job.get("_title_lower", "")
    if not title or not skills:
        return 0.3
    for s in skills:
        if re.search(r'\b' + re.escape(s.lower()) + r'\b', title):
            return 1.0
    return 0.2


def _level_score(job: dict, desired_levels: list[str] | None) -> float:
    """0.0–1.0: seniority alignment between job and the user's target levels."""
    if not desired_levels:
        return 0.5
    job_level = job.get("level", "").lower()
    if any(w in job_level for w in ("senior", "lead", "principal")):
        job_bucket = "senior"
    elif any(w in job_level for w in ("entry", "junior", "intern", "fresher", "associate")):
        job_bucket = "entry"
    else:
        job_bucket = "mid"

    for dl in desired_levels:
        dl_l = dl.lower()
        if any(w in dl_l for w in ("senior", "master", "advanced")):
            return {"senior": 1.0, "mid": 0.5, "entry": 0.1}[job_bucket]
        elif any(w in dl_l for w in ("beginner", "entry", "started", "get started")):
            return {"entry": 1.0, "mid": 0.5, "senior": 0.2}[job_bucket]
        else:  # intermediate / mid
            return {"mid": 1.0, "entry": 0.5, "senior": 0.5}[job_bucket]
    return 0.5


def _location_score(job: dict, preferred_location: str | None) -> float:
    if not preferred_location:
        return 0.5
    loc = (job.get("location") or "").lower()
    return 1.0 if preferred_location.lower() in loc else 0.3


def _rank(job: dict, skills: list[str], levels: list[str] | None, location: str | None) -> float:
    return (
        0.40 * _skill_score(job, skills)
        + 0.30 * _title_score(job, skills)
        + 0.20 * _level_score(job, levels)
        + 0.10 * _location_score(job, location)
    )


def _clean(job: dict) -> dict:
    """Strip internal underscore fields before returning to the API."""
    return {k: v for k, v in job.items() if not k.startswith("_")}


# ── Service ───────────────────────────────────────────────────────────────────

class JobsService:

    async def fetch_jobs_from_naukri(
        self,
        skills: list[str],
        num_jobs: int = 9,
        levels: list[str] | None = None,
        location: str | None = "India",
    ) -> dict[str, Any]:
        """
        Fetch real jobs from LinkedIn + Naukri, score them, return top-N.
        Never falls back to AI-generated data.
        """
        if not skills:
            return {"success": False, "error": "No skills provided."}

        loop = asyncio.get_event_loop()
        per_site = max(num_jobs, 15)          # fetch more so scoring has better pool

        try:
            linkedin_jobs, naukri_jobs = await asyncio.gather(
                loop.run_in_executor(
                    None, fetch_linkedin_jobs, skills, location or "India", per_site
                ),
                loop.run_in_executor(
                    None, fetch_naukri_jobs, skills, location or "India", per_site
                ),
            )
        except Exception as exc:
            traceback.print_exc()
            return {"success": False, "error": f"Scraper failed: {exc}"}

        raw_jobs = linkedin_jobs + naukri_jobs
        print(f"[jobs] real: {len(linkedin_jobs)} LinkedIn + {len(naukri_jobs)} Naukri")

        if not raw_jobs:
            return {
                "success": False,
                "error": (
                    "No live job listings found right now for these skills. "
                    "Job boards occasionally rate-limit automated requests — "
                    "please try again in a few seconds."
                ),
            }

        # Score + deduplicate by title+company
        seen: set[str] = set()
        unique: list[dict] = []
        for job in raw_jobs:
            key = (job.get("title", "").lower(), job.get("company", "").lower())
            if key not in seen:
                seen.add(key)
                job["_score"] = _rank(job, skills, levels, location)
                unique.append(job)

        ranked = sorted(unique, key=lambda j: j["_score"], reverse=True)
        top = [_clean(j) for j in ranked[:num_jobs]]

        return {"success": True, "data": {"jobs": top}}


# Singleton used by the route layer
jobs_service = JobsService()
