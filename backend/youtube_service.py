
import os
from pathlib import Path

from dotenv import load_dotenv
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError


# Load the .env file located in the same folder as this file.
BACKEND_DIR = Path(__file__).resolve().parent
load_dotenv(BACKEND_DIR / ".env")

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")


def get_youtube_client():
    """Create a YouTube Data API client using the private API key."""
    if not YOUTUBE_API_KEY:
        raise RuntimeError(
            "YOUTUBE_API_KEY is missing. "
            "Add it to your backend/.env file."
        )

    return build(
        "youtube",
        "v3",
        developerKey=YOUTUBE_API_KEY,
        cache_discovery=False,
    )


def extract_video_id(video_url: str) -> str:
    """
    Extract a YouTube video ID from common URL formats.

    Supports:
    - https://www.youtube.com/watch?v=VIDEO_ID
    - https://youtu.be/VIDEO_ID
    - https://www.youtube.com/shorts/VIDEO_ID
    - https://www.youtube.com/embed/VIDEO_ID

    A raw video ID is also accepted.
    """
    from urllib.parse import urlparse, parse_qs
    import re

    if not video_url or not video_url.strip():
        raise ValueError("Please enter a YouTube video URL or ID.")

    value = video_url.strip()

    # Accept a raw 11-character YouTube video ID.
    if re.fullmatch(r"[A-Za-z0-9_-]{11}", value):
        return value

    parsed = urlparse(value)

    # Only accept known YouTube hosts.
    allowed_hosts = {
        "youtube.com",
        "www.youtube.com",
        "m.youtube.com",
        "music.youtube.com",
        "youtu.be",
        "www.youtu.be",
    }

    hostname = (parsed.hostname or "").lower()

    if hostname not in allowed_hosts:
        raise ValueError("Please provide a valid YouTube video URL.")

    video_id = None

    if hostname in {"youtu.be", "www.youtu.be"}:
        video_id = parsed.path.strip("/").split("/")[0]
    elif parsed.path == "/watch":
        video_id = parse_qs(parsed.query).get("v", [None])[0]
    else:
        match = re.match(
            r"^/(?:shorts|embed|live)/([A-Za-z0-9_-]{11})",
            parsed.path,
        )
        if match:
            video_id = match.group(1)

    if not video_id or not re.fullmatch(r"[A-Za-z0-9_-]{11}", video_id):
        raise ValueError("Could not extract a valid YouTube video ID.")

    return video_id


def test_youtube_connection():
    """Check whether the API key can retrieve public video information."""
    youtube = get_youtube_client()

    response = youtube.videos().list(
        part="snippet",
        id="dQw4w9WgXcQ",
    ).execute()

    items = response.get("items", [])

    if not items:
        return {
            "success": False,
            "message": "No video details returned. Check the API settings.",
        }

    return {
        "success": True,
        "message": "YouTube Data API connection successful.",
        "video_title": items[0]["snippet"]["title"],
    }


def fetch_youtube_comments(
    video_id: str,
    max_comments: int = 100,
):
    """
    Fetch up to max_comments public top-level comments.

    Returns a list of dictionaries containing comment text,
    author, publication date, and like count.
    """
    if not 1 <= max_comments <= 500:
        raise ValueError("max_comments must be between 1 and 500.")

    # Accept either a video ID or a full YouTube URL.
    video_id = extract_video_id(video_id)

    youtube = get_youtube_client()
    comments = []
    page_token = None

    try:
        while len(comments) < max_comments:
            remaining = max_comments - len(comments)

            request_args = {
                "part": "snippet",
                "videoId": video_id,
                "maxResults": min(100, remaining),
                "textFormat": "plainText",
            }

            if page_token:
                request_args["pageToken"] = page_token

            response = youtube.commentThreads().list(
                **request_args
            ).execute()

            for item in response.get("items", []):
                thread_snippet = item.get("snippet", {})
                top_comment = thread_snippet.get(
                    "topLevelComment", {}
                )
                snippet = top_comment.get("snippet", {})

                comments.append({
                    "comment_id": top_comment.get("id", ""),
                    "text": snippet.get("textDisplay", ""),
                    "author": snippet.get(
                        "authorDisplayName", "Unknown"
                    ),
                    "published_at": snippet.get("publishedAt"),
                    "like_count": snippet.get("likeCount", 0),
                })

                if len(comments) >= max_comments:
                    break

            page_token = response.get("nextPageToken")

            if not page_token or not response.get("items"):
                break

    except HttpError as error:
        status = getattr(error.resp, "status", None)

        if status == 403:
            raise RuntimeError(
                "YouTube could not return comments. "
                "Check API restrictions, quota, and whether "
                "comments are available for this video."
            ) from error

        if status == 404:
            raise RuntimeError(
                "The video could not be found."
            ) from error

        raise RuntimeError(
            f"YouTube API request failed: {error}"
        ) from error

    return comments


if __name__ == "__main__":
    try:
        print("Testing YouTube Data API connection...")
        print(test_youtube_connection())

        print("\nFetching up to 10 comments...")
        results = fetch_youtube_comments(
            video_id="dQw4w9WgXcQ",
            max_comments=10,
        )

        print(f"\nRetrieved {len(results)} comments.")

        for index, comment in enumerate(results, start=1):
            print(f"\nComment {index}")
            print(f"Author: {comment['author']}")
            print(f"Text: {comment['text']}")
            print(f"Likes: {comment['like_count']}")
            print(f"Published: {comment['published_at']}")

    except (RuntimeError, ValueError) as error:
        print(f"\nError: {error}")
    except HttpError as error:
        print(f"\nYouTube API error: {error}")
