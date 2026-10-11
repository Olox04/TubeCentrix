
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from youtube_service import (
    extract_video_id,
    fetch_youtube_comments,
)
from sentiment_service import analyse_comments


app = FastAPI(
    title="TubeCentrix API",
    description="YouTube comment sentiment and emoji analysis.",
    version="1.0.0",
)

# Allow requests from your local React development server.
# Restrict this list to your actual frontend origin in production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


class AnalysisRequest(BaseModel):
    video_url: str = Field(
        ...,
        min_length=1,
        description="YouTube video URL or video ID",
    )
    max_comments: int = Field(default=100, ge=1, le=500)


@app.get("/")
def home():
    return {
        "success": True,
        "message": "TubeCentrix API is running!",
    }


@app.get("/health")
def health_check():
    return {
        "success": True,
        "service": "TubeCentrix API",
        "status": "healthy",
    }


@app.post("/api/analyze")
def analyze_video(request: AnalysisRequest):
    """
    Fetch and analyse YouTube comments for the supplied video.
    """
    try:
        video_id = extract_video_id(request.video_url)

        comments = fetch_youtube_comments(
            video_id=video_id,
            max_comments=request.max_comments,
        )

        results = analyse_comments(comments)

        return {
            "success": True,
            "video_id": video_id,
            "total_fetched": len(comments),
            **results,
        }

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error

    except RuntimeError as error:
        raise HTTPException(
            status_code=502,
            detail=str(error),
        ) from error

    except Exception as error:
        # Keep internal details out of the public response.
        print(f"Unexpected analysis error: {error}")
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred during analysis.",
        ) from error
