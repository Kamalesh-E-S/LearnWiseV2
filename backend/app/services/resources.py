import requests
from dotenv import load_dotenv
import os

load_dotenv()

# Store API keys securely
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
CX_ID = os.getenv("CX_ID")
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")

# new keys
# GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
# CX_ID = os.getenv("CX_ID")
# YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")

def get_website_links(query):
    """Fetches 2 website links from Google Custom Search API."""
    url = f"https://www.googleapis.com/customsearch/v1?q={query}&key={GOOGLE_API_KEY}&cx={CX_ID}&num=2"
    response = requests.get(url).json()
    return [item["link"] for item in response.get("items", [])]  # Get top 2 links
    # return []

def get_video_links(query):
    """Fetches 2 YouTube video links using YouTube Data API."""
    url = f"https://www.googleapis.com/youtube/v3/search?part=snippet&q={query}&type=video&maxResults=2&key={YOUTUBE_API_KEY}&num=2"
    response = requests.get(url).json()
    videos = []
    for item in response.get("items", []):
        video_id = item.get("id", {}).get("videoId")
        if video_id:
            videos.append(f"https://www.youtube.com/watch?v={video_id}")
    return videos
def get_links_for_topics(topics):
    """Fetches website and video links for a list of topics."""
    results = {}
    for topic in topics:
        websites = get_website_links(topic)
        videos = get_video_links(topic)
        results[topic] = {
            "websites": websites,
            "videos": videos
        }
    return results

# Example List of Topics
topics = ["retrieval augmented generation", "machine learning", "data structures", "deep learning"]

# Fetch and Display Links
results = get_links_for_topics(topics)
for topic, links in results.items():
    print(f"\n🔹 {topic.upper()}")
    print("Websites:", links["websites"])
    print("Videos:", links["videos"])
