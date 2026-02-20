"""
src/job_api.py
Real job fetchers using python-jobspy — scrapes LinkedIn and Naukri.
Returns a list of normalized dicts (one per job).
"""
from __future__ import annotations

import re
import traceback
from typing import Any

# python-jobspy converts results to a pandas DataFrame
from jobspy import scrape_jobs


# ── helpers ──────────────────────────────────────────────────────────────────

def _safe_str(val: Any, fallback: str = "") -> str:
    if val is None:
        return fallback
    s = str(val).strip()
    return fallback if s in ("nan", "None", "") else s


def _build_salary(row: Any) -> str:
    """Build a human-readable salary string from jobspy columns."""
    try:
        mn = row.get("min_amount") if hasattr(row, "get") else getattr(row, "min_amount", None)
        mx = row.get("max_amount") if hasattr(row, "get") else getattr(row, "max_amount", None)
        interval = _safe_str(row.get("interval") if hasattr(row, "get") else getattr(row, "interval", ""), "yearly")
        currency = _safe_str(row.get("currency") if hasattr(row, "get") else getattr(row, "currency", ""), "INR")

        if mn and str(mn) not in ("nan", "None", ""):
            mn_f = float(mn)
            mx_f = float(mx) if mx and str(mx) not in ("nan", "None") else mn_f
            if interval.lower() == "yearly":
                return f"₹{mn_f:,.0f} – ₹{mx_f:,.0f} / year"
            elif interval.lower() == "monthly":
                return f"₹{mn_f:,.0f} – ₹{mx_f:,.0f} / month"
            else:
                return f"₹{mn_f:,.0f} – ₹{mx_f:,.0f}"
    except Exception:
        pass
    return "Salary not disclosed"


def _normalize_job_type(jt: str) -> str:
    mapping = {
        "fulltime": "Full-time", "full_time": "Full-time", "full-time": "Full-time",
        "parttime": "Part-time", "part_time": "Part-time", "part-time": "Part-time",
        "contract": "Contract",
        "internship": "Internship",
        "remote": "Remote",
    }
    return mapping.get((jt or "").lower().replace(" ", ""), jt or "Full-time")


def _extract_skills_from_description(desc: str, keywords: list[str]) -> list[str]:
    """Simple keyword match against the job description to find relevant skills."""
    if not desc:
        return []
    desc_lower = desc.lower()
    found = []
    for kw in keywords:
        pattern = r'\b' + re.escape(kw.lower()) + r'\b'
        if re.search(pattern, desc_lower):
            found.append(kw)
    return found


def _row_to_dict(row, site: str, query_keywords: list[str]) -> dict:
    """Convert a jobspy DataFrame row to our normalized job dict."""
    if hasattr(row, "_asdict"):
        r = row._asdict()
    elif hasattr(row, "to_dict"):
        r = row.to_dict()
    else:
        r = dict(row)

    title = _safe_str(r.get("title"), "Untitled Role")
    company = _safe_str(r.get("company"), "Unknown Company")
    location = _safe_str(r.get("location") or f"{_safe_str(r.get('city'))} {_safe_str(r.get('state'))}".strip(), "")
    job_url = _safe_str(r.get("job_url"), "")
    description = _safe_str(r.get("description"), "")
    job_type_raw = _safe_str(r.get("job_type", ""), "")
    is_remote = r.get("is_remote", False)

    job_type = "Remote" if is_remote else _normalize_job_type(job_type_raw)
    salary = _build_salary(r)

    # Infer seniority from title
    title_lower = title.lower()
    if any(w in title_lower for w in ("senior", "lead", "principal", "staff", "architect")):
        level = "Senior"
    elif any(w in title_lower for w in ("junior", "entry", "associate", "graduate", "intern")):
        level = "Entry-level"
    else:
        level = "Mid-level"

    # Skills matched from description
    required_skills = _extract_skills_from_description(description, query_keywords)
    # Always include the raw search keywords if nothing found
    if not required_skills:
        required_skills = query_keywords[:3]

    # Trim description
    short_desc = (description[:320] + "…") if len(description) > 320 else description

    return {
        "source": site,
        "title": title,
        "company": company,
        "location": location,
        "job_url": job_url,
        "description": short_desc,
        "required_skills": required_skills,
        "salary_range": salary,
        "job_type": job_type,
        "level": level,
        # Raw for scoring
        "_full_description": description.lower(),
        "_title_lower": title_lower,
    }


# ── public API ────────────────────────────────────────────────────────────────

def fetch_linkedin_jobs(keywords: list[str], location: str = "India", max_results: int = 15) -> list[dict]:
    """Scrape LinkedIn for jobs matching any of the given keywords."""
    query = " OR ".join(keywords) if len(keywords) > 1 else keywords[0]
    try:
        df = scrape_jobs(
            site_name=["linkedin"],
            search_term=query,
            location=location,
            results_wanted=max_results,
            hours_old=72,
            verbose=0,
        )
        if df is None or df.empty:
            return []
        return [_row_to_dict(row, "LinkedIn", keywords) for _, row in df.iterrows()]
    except Exception:
        traceback.print_exc()
        return []


def fetch_naukri_jobs(keywords: list[str], location: str = "India", max_results: int = 15) -> list[dict]:
    """Scrape Naukri for jobs matching any of the given keywords."""
    query = " OR ".join(keywords) if len(keywords) > 1 else keywords[0]
    try:
        df = scrape_jobs(
            site_name=["naukri"],
            search_term=query,
            location=location,
            results_wanted=max_results,
            hours_old=72,
            verbose=0,
        )
        if df is None or df.empty:
            return []
        return [_row_to_dict(row, "Naukri", keywords) for _, row in df.iterrows()]
    except Exception:
        traceback.print_exc()
        return []
