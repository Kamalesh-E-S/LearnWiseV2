import requests
from dotenv import load_dotenv
import os

load_dotenv()

# Store API keys securely
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
CX_ID = os.getenv("CX_ID")
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")


def get_website_links(query: str) -> list[str]:
    """Fetches up to 2 website links from Google Custom Search API."""
    if not GOOGLE_API_KEY or not CX_ID:
        return []
    try:
        url = (
            f"https://www.googleapis.com/customsearch/v1"
            f"?q={query}&key={GOOGLE_API_KEY}&cx={CX_ID}&num=2"
        )
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        return [item["link"] for item in response.json().get("items", [])]
    except Exception as e:
        print(f"[resources] get_website_links failed for '{query}': {e}")
        return []


def get_video_links(query: str) -> list[str]:
    """Fetches up to 2 YouTube video links using YouTube Data API."""
    if not YOUTUBE_API_KEY:
        return []
    try:
        url = (
            f"https://www.googleapis.com/youtube/v3/search"
            f"?part=snippet&q={query}&type=video&maxResults=2&key={YOUTUBE_API_KEY}"
        )
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        videos = []
        for item in response.json().get("items", []):
            video_id = item.get("id", {}).get("videoId")
            if video_id:
                videos.append(f"https://www.youtube.com/watch?v={video_id}")
        return videos
    except Exception as e:
        print(f"[resources] get_video_links failed for '{query}': {e}")
        return []
