
import re
import pandas as pd
import emoji

from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer


# Initialise VADER once for reuse.
vader_analyzer = SentimentIntensityAnalyzer()


def extract_emojis(text: str) -> list:
    """Extract emojis from a comment, preserving repeated emojis."""
    if not isinstance(text, str):
        return []

    return [
        match["emoji"]
        for match in emoji.emoji_list(text)
    ]


def analyse_sentiment(text: str) -> dict:
    """
    Analyse a comment with VADER.

    Returns the compound score and Positive, Neutral or Negative
    classification.
    """
    if not isinstance(text, str):
        text = ""

    scores = vader_analyzer.polarity_scores(text)
    compound = scores["compound"]

    if compound >= 0.05:
        sentiment = "Positive"
    elif compound <= -0.05:
        sentiment = "Negative"
    else:
        sentiment = "Neutral"

    return {
        "sentiment": sentiment,
        "compound": compound,
        "positive": scores["pos"],
        "neutral": scores["neu"],
        "negative": scores["neg"],
    }


def analyse_comments(comments: list) -> dict:
    """
    Analyse YouTube comments for sentiment and emoji usage.

    Input:
        A list of dictionaries returned by youtube_service.py.

    Output:
        Comment-level results, summary statistics, emoji counts,
        sentiment counts and chart-ready data.
    """
    if not comments:
        return {
            "success": True,
            "total_comments": 0,
            "sentiment_counts": {
                "Positive": 0,
                "Neutral": 0,
                "Negative": 0,
            },
            "sentiment_percentages": {
                "Positive": 0,
                "Neutral": 0,
                "Negative": 0,
            },
            "emoji_counts": [],
            "total_emojis": 0,
            "comments": [],
            "message": "No comments were available to analyse.",
        }

    df = pd.DataFrame(comments)

    # Ensure required columns exist.
    if "text" not in df.columns:
        df["text"] = ""

    if "author" not in df.columns:
        df["author"] = "Unknown"

    if "published_at" not in df.columns:
        df["published_at"] = None

    if "like_count" not in df.columns:
        df["like_count"] = 0

    # Clean comment text while preserving emoji characters.
    df["text"] = df["text"].fillna("").astype(str)

    # Sentiment analysis.
    sentiment_results = df["text"].apply(analyse_sentiment)
    sentiment_df = pd.DataFrame(sentiment_results.tolist())
    df = pd.concat([df, sentiment_df], axis=1)

    # Emoji extraction.
    df["emojis"] = df["text"].apply(extract_emojis)
    df["emoji_count"] = df["emojis"].apply(len)

    total_comments = len(df)

    # Sentiment chart counts, including categories with zero comments.
    sentiment_counts = (
        df["sentiment"]
        .value_counts()
        .reindex(["Positive", "Neutral", "Negative"], fill_value=0)
        .to_dict()
    )

    sentiment_percentages = {
        label: round((count / total_comments) * 100, 2)
        for label, count in sentiment_counts.items()
    }

    # Flatten emoji lists and count individual emoji occurrences.
    all_emojis = [
        item
        for comment_emojis in df["emojis"]
        for item in comment_emojis
    ]

    if all_emojis:
        emoji_series = pd.Series(all_emojis, dtype="object")
        emoji_counts = (
            emoji_series
            .value_counts()
            .rename_axis("emoji")
            .reset_index(name="count")
        )

        emoji_counts = emoji_counts.to_dict(orient="records")
    else:
        emoji_counts = []

    # Prepare comment data for JSON responses.
    result_columns = [
        "text",
        "author",
        "published_at",
        "like_count",
        "sentiment",
        "compound",
        "positive",
        "neutral",
        "negative",
        "emojis",
        "emoji_count",
    ]

    # Convert NumPy/Pandas values into JSON-friendly Python values.
    result_df = df[result_columns].copy()
    result_df["like_count"] = pd.to_numeric(
        result_df["like_count"], errors="coerce"
    ).fillna(0).astype(int)

    result_df["published_at"] = result_df["published_at"].where(
        result_df["published_at"].notna(), None
    )

    analysed_comments = result_df.to_dict(orient="records")

    return {
        "success": True,
        "total_comments": total_comments,
        "sentiment_counts": sentiment_counts,
        "sentiment_percentages": sentiment_percentages,
        "total_emojis": len(all_emojis),
        "unique_emojis": len(set(all_emojis)),
        "emoji_counts": emoji_counts,
        "comments": analysed_comments,
    }


if __name__ == "__main__":
    # Example test comments. These are for testing only.
    sample_comments = [
        {
            "text": "This video is amazing! ❤️🔥",
            "author": "ViewerOne",
            "published_at": "2026-10-11T12:00:00Z",
            "like_count": 10,
        },
        {
            "text": "It is okay, nothing special.",
            "author": "ViewerTwo",
            "published_at": "2026-10-11T12:10:00Z",
            "like_count": 2,
        },
        {
            "text": "I really dislike this. 😡👎",
            "author": "ViewerThree",
            "published_at": "2026-10-11T12:20:00Z",
            "like_count": 0,
        },
        {
            "text": "😂😂😂 I can't stop laughing!",
            "author": "ViewerFour",
            "published_at": "2026-10-11T12:30:00Z",
            "like_count": 5,
        },
    ]

    results = analyse_comments(sample_comments)

    print("\n===== TUBECENTRIX ANALYSIS TEST =====")
    print(f"Total comments: {results['total_comments']}")
    print(f"Sentiment counts: {results['sentiment_counts']}")
    print(f"Sentiment percentages: {results['sentiment_percentages']}")
    print(f"Total emojis: {results['total_emojis']}")
    print(f"Unique emojis: {results['unique_emojis']}")
    print(f"Emoji counts: {results['emoji_counts']}")

    print("\nAnalysed comments:")
    for comment in results["comments"]:
        print(
            f"\n{comment['author']}: {comment['text']}\n"
            f"Sentiment: {comment['sentiment']} "
            f"(score: {comment['compound']})\n"
            f"Emojis: {comment['emojis']}"
        )
