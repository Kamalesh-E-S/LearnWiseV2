"""
src/mcp_server.py
FastMCP server that exposes two tools:
  - fetchlinkedin(listofkey)  → LinkedIn jobs
  - fetchnaukri(listofkey)    → Naukri jobs

Run standalone:  python src/mcp_server.py
Or via MCP host with transport='stdio'.
"""
import sys
import os

# Make sure the backend root is on sys.path so `src.job_api` resolves
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from mcp.server.fastmcp import FastMCP
from src.job_api import fetch_linkedin_jobs, fetch_naukri_jobs

mcp = FastMCP("Job Recommender")


@mcp.tool()
async def fetchlinkedin(listofkey: list[str]) -> list[dict]:
    """
    Fetch real job listings from LinkedIn for the given list of skills/keywords.

    Args:
        listofkey: e.g. ["Python", "FastAPI", "Machine Learning"]

    Returns:
        List of normalised job dicts.
    """
    return fetch_linkedin_jobs(keywords=listofkey)


@mcp.tool()
async def fetchnaukri(listofkey: list[str]) -> list[dict]:
    """
    Fetch real job listings from Naukri for the given list of skills/keywords.

    Args:
        listofkey: e.g. ["Python", "FastAPI"]

    Returns:
        List of normalised job dicts.
    """
    return fetch_naukri_jobs(keywords=listofkey)


if __name__ == "__main__":
    mcp.run(transport="stdio")
