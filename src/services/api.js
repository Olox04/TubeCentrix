

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? "http://127.0.0.1:8000"
    : "https://tubecentrix.onrender.com")
).replace(/\/$/, "");


export async function analyzeYouTubeVideo(videoUrl, maxComments = 100) {
  const response = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      video_url: videoUrl,
      max_comments: maxComments,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof data.detail === "string"
        ? data.detail
        : "Unable to analyse this YouTube video."
    );
  }

  return data;
}
