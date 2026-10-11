
import { useMemo, useState } from "react";

import {
  Search,
  Link2,
  MessageCircle,
  Smile,
  HeartPulse,
  Sparkles,
  Sun,
  Bell,
  ArrowUpRight,
  Clock3,
  CalendarDays,
  Lightbulb,
} from "lucide-react";

import Sidebar from "./components/Sidebar";
import StatCard from "./components/StatCard";
import SentimentPieChart from "./components/SentimentPieChart";
import EmojiChart from "./components/EmojiChart";
import RecentComments from "./components/RecentComments";

import {
  mockComments,
  sentimentData,
  emojiData,
  scoreData,
} from "./data/mockData";

import { analyzeYouTubeVideo } from "./services/api";

import "./App.css";

function isYouTubeUrl(value) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();

    const supportedHosts = [
      "youtube.com",
      "www.youtube.com",
      "m.youtube.com",
      "youtu.be",
      "www.youtu.be",
      "youtube-nocookie.com",
      "www.youtube-nocookie.com",
    ];

    return (
      supportedHosts.includes(hostname) &&
      (hostname === "youtu.be" ||
        url.searchParams.has("v") ||
        url.pathname.startsWith("/shorts/") ||
        url.pathname.startsWith("/embed/") ||
        url.pathname.startsWith("/live/"))
    );
  } catch {
    return false;
  }
}

export default function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [message, setMessage] = useState("");
  const [analyzed, setAnalyzed] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [darkMode, setDarkMode] = useState(true);

  // Use real comments after a successful analysis.
  // Otherwise, keep the existing demonstration data.
  const dashboardComments = useMemo(() => {
    if (!analysisData) {
      return mockComments;
    }

    return (analysisData.comments || []).map((comment) => ({
      ...comment,
      username: comment.author || "Unknown",
      text: comment.text || "",
      likes: comment.like_count ?? 0,
      emojis: comment.emojis || [],
      compound: comment.compound ?? 0,
    }));
  }, [analysisData]);

  // Search and filter whichever comments are currently displayed.
  const comments = useMemo(() => {
    return dashboardComments.filter((comment) => {
      const matchesSearch = `${comment.username || ""} ${
        comment.text || ""
      }`
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesFilter =
        filter === "All" || comment.sentiment === filter;

      return matchesSearch && matchesFilter;
    });
  }, [dashboardComments, search, filter]);

  // Connect to the Python backend and analyse a YouTube video.
  const runAnalysis = async () => {
    setMessage("");

    if (!youtubeUrl.trim()) {
      setMessage("Please enter a YouTube video URL.");
      return;
    }

    if (!isYouTubeUrl(youtubeUrl.trim())) {
      setMessage("Please enter a valid YouTube video URL.");
      return;
    }

    setLoading(true);

    try {
      const result = await analyzeYouTubeVideo(
        youtubeUrl.trim(),
        100
      );

      if (result.success === false) {
        throw new Error(
          result.message || "The video could not be analysed."
        );
      }

      setAnalysisData(result);
      setAnalyzed(true);
      setActivePage("Dashboard");
      setSearch("");
      setFilter("All");

      setMessage(
        `Analysis complete! Analysed ${
          result.total_comments ?? result.comments?.length ?? 0
        } YouTube comments.`
      );
    } catch (error) {
      setMessage(
        error.message ||
          "Analysis failed. Check that your Python backend is running and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Calculate dashboard metrics.
  const totalComments = analysisData
    ? analysisData.total_comments ?? dashboardComments.length
    : mockComments.length;

  const totalEmojis = analysisData
    ? analysisData.total_emojis ??
      dashboardComments.reduce(
        (total, comment) =>
          total + (comment.emojis?.length || 0),
        0
      )
    : mockComments.reduce(
        (total, comment) =>
          total + (comment.emojis?.length || 0),
        0
      );

  const averageScore = dashboardComments.length
    ? dashboardComments.reduce(
        (total, comment) =>
          total + (Number(comment.compound) || 0),
        0
      ) / dashboardComments.length
    : 0;

  const positiveCount = analysisData
    ? analysisData.sentiment_counts?.Positive ?? 0
    : mockComments.filter(
        (comment) => comment.sentiment === "Positive"
      ).length;

  const neutralCount = analysisData
    ? analysisData.sentiment_counts?.Neutral ?? 0
    : mockComments.filter(
        (comment) => comment.sentiment === "Neutral"
      ).length;

  const negativeCount = analysisData
    ? analysisData.sentiment_counts?.Negative ?? 0
    : mockComments.filter(
        (comment) => comment.sentiment === "Negative"
      ).length;

  const sentimentPercentages = analysisData?.sentiment_percentages;

  const positivePercentage =
    sentimentPercentages?.Positive ??
    (totalComments
      ? Math.round((positiveCount / totalComments) * 100)
      : 0);

  const neutralPercentage =
    sentimentPercentages?.Neutral ??
    (totalComments
      ? Math.round((neutralCount / totalComments) * 100)
      : 0);

  const negativePercentage =
    sentimentPercentages?.Negative ??
    (totalComments
      ? Math.max(
          0,
          100 - positivePercentage - neutralPercentage
        )
      : 0);

  const dynamicSentiment = [
    {
      name: "Positive",
      value: positivePercentage,
      color: "#28D7A0",
    },
    {
      name: "Neutral",
      value: neutralPercentage,
      color: "#5598FF",
    },
    {
      name: "Negative",
      value: negativePercentage,
      color: "#FF5577",
    },
  ];

  const sentimentForChart = analyzed
    ? dynamicSentiment
    : sentimentData;

  const currentEmojiData = analysisData
    ? (analysisData.emoji_counts || []).map((item) => ({
        emoji: item.emoji,
        count: item.count,
      }))
    : emojiData;

  // Calculate VADER score distribution from the current comments.
  const currentScoreData = useMemo(() => {
    if (!analysisData) {
      return scoreData;
    }

    const ranges = [
      { range: "−1.0 to −0.6", min: -1, max: -0.6 },
      { range: "−0.6 to −0.2", min: -0.6, max: -0.2 },
      { range: "−0.2 to +0.2", min: -0.2, max: 0.2 },
      { range: "+0.2 to +0.6", min: 0.2, max: 0.6 },
      { range: "+0.6 to +1.0", min: 0.6, max: 1.01 },
    ];

    return ranges.map((range) => ({
      range: range.range,
      count: dashboardComments.filter((comment) => {
        const score = Number(comment.compound) || 0;
        return score >= range.min && score < range.max;
      }).length,
    }));
  }, [analysisData, dashboardComments]);

  const maxScoreCount = Math.max(
    1,
    ...currentScoreData.map((item) => item.count)
  );

  // Export the currently available comments to CSV.
  const exportComments = () => {
    const headers = [
      "Username",
      "Comment",
      "Sentiment",
      "VADER Compound",
      "Emojis",
      "Emoji Count",
      "Likes",
      "Published At",
    ];

    const rows = dashboardComments.map((comment) => [
      comment.username || comment.author || "Unknown",
      comment.text || "",
      comment.sentiment || "Unknown",
      comment.compound ?? 0,
      (comment.emojis || []).join(" "),
      comment.emoji_count ?? comment.emojis?.length ?? 0,
      comment.likes ?? comment.like_count ?? 0,
      comment.published_at || "",
    ]);

    const csvCell = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csv = [headers, ...rows]
      .map((row) => row.map(csvCell).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = analysisData
      ? "tubecentrix-youtube-analysis.csv"
      : "tubecentrix-demo-comments.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };

  return (
    <div className={`app-shell ${darkMode ? "" : "light-mode"}`}>
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
      />

      <main className="main-area">
        <header className="topbar">
          <div className="mobile-brand">
            <span className="brand-icon small">▶</span>
            <strong>
              Tube<span>Centrix</span>
            </strong>
          </div>

          <form
            className="url-search"
            onSubmit={(event) => {
              event.preventDefault();
              runAnalysis();
            }}
          >
            <Link2 size={19} />

            <input
              value={youtubeUrl}
              onChange={(event) => setYoutubeUrl(event.target.value)}
              placeholder="Paste a YouTube video URL here..."
              aria-label="YouTube video URL"
            />

            <button
              type="submit"
              className="analyze-button"
              disabled={loading}
            >
              <Search size={17} />
              <span>
                {loading ? "Analyzing..." : "Analyze"}
              </span>
            </button>
          </form>

          <div className="topbar-actions">
            <button
              className="icon-button"
              title="Toggle theme"
              onClick={() => setDarkMode(!darkMode)}
            >
              <Sun size={19} />
            </button>

            <button
              className="icon-button"
              title="Notifications"
              onClick={() =>
                setMessage("You're all caught up on notifications.")
              }
            >
              <Bell size={19} />
            </button>
          </div>
        </header>

        <div className="page-content">
          <div className="welcome-row">
            <div>
              <p className="eyebrow">
                YOUTUBE COMMENT INTELLIGENCE
              </p>

              <h1>
                {activePage === "Dashboard"
                  ? "Audience overview"
                  : activePage}
                <span className="heading-sparkle"> ✦</span>
              </h1>

              <p className="page-subtitle">
                Turn comments, emotions and emojis into meaningful
                insights.
              </p>
            </div>

            <div className="date-chip">
              <CalendarDays size={15} />
              <span>
                {new Date().toLocaleDateString("en-ZA", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          {message && (
            <div className="notice" role="status">
              <Lightbulb size={17} />
              <span>{message}</span>
              <button
                onClick={() => setMessage("")}
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          )}

          <section className="video-summary panel">
            <div className="video-thumbnail">
              <div className="thumbnail-decoration">✦</div>
              <div className="play-icon">▶</div>
              <span className="thumbnail-label">
                VIDEO ANALYTICS
              </span>
            </div>

            <div className="video-details">
              <div className="video-label">
                <span className="live-dot" />
                {analysisData
                  ? "LIVE YOUTUBE ANALYSIS"
                  : "YOUR NEXT INSIGHT STARTS HERE"}
              </div>

              <h2>
                {analysisData
                  ? "YouTube video analysis"
                  : "Ready to understand your viewers?"}
              </h2>

              <p className="video-url">
                <Link2 size={14} />
                {youtubeUrl ||
                  "Paste a YouTube URL above to get started"}
              </p>

              <div className="video-meta">
                <span>
                  <MessageCircle size={14} />
                  {totalComments.toLocaleString()} comments
                </span>

                <span>
                  <Clock3 size={14} />
                  {analysisData ? "Live results" : "Demo data"}
                </span>
              </div>
            </div>

            <div className="video-status">
              <span className="status-pill">
                <span className="status-dot" />
                {analysisData ? "Analysis complete" : "Demo preview"}
              </span>

              <p>
                {analysisData
                  ? "Python + VADER connected"
                  : "Paste a video URL to begin"}
              </p>
            </div>
          </section>

          {activePage === "Dashboard" && (
            <>
              <section className="stats-grid">
                <StatCard
                  title="Total Comments"
                  value={totalComments.toLocaleString()}
                  subtitle={
                    analysisData
                      ? "Fetched from YouTube"
                      : "Sample comments"
                  }
                  icon={MessageCircle}
                  color="blue"
                />

                <StatCard
                  title="Total Emojis"
                  value={totalEmojis.toLocaleString()}
                  subtitle={
                    analysisData
                      ? "Found in YouTube comments"
                      : "In sample comments"
                  }
                  icon={Smile}
                  color="yellow"
                />

                <StatCard
                  title="Overall Sentiment"
                  value={`${positivePercentage}%`}
                  subtitle="Positive comments"
                  icon={HeartPulse}
                  color="green"
                />

                <StatCard
                  title="Average VADER"
                  value={averageScore.toFixed(2)}
                  subtitle="Compound score · −1 to +1"
                  icon={Sparkles}
                  color="purple"
                />
              </section>

              <section className="charts-grid">
                <SentimentPieChart data={sentimentForChart} />

                <EmojiChart data={currentEmojiData} />

                <div className="chart-card score-card">
                  <div className="chart-heading">
                    <div>
                      <Sparkles size={19} />
                      <h3>VADER Score Distribution</h3>
                    </div>

                    <span className="chart-tag">Compound</span>
                  </div>

                  <div className="score-list">
                    {currentScoreData.map((item, index) => (
                      <div className="score-row" key={item.range}>
                        <span>{item.range}</span>

                        <div className="score-track">
                          <div
                            className={`score-fill score-${index}`}
                            style={{
                              width: `${
                                (item.count / maxScoreCount) * 100
                              }%`,
                            }}
                          />
                        </div>

                        <strong>{item.count}</strong>
                      </div>
                    ))}
                  </div>

                  <p className="chart-note">
                    VADER compound scores range from −1 (negative)
                    to +1 (positive).
                  </p>
                </div>

                <div className="chart-card insights-card">
                  <div className="chart-heading">
                    <div>
                      <Sparkles size={19} />
                      <h3>Quick Insights</h3>
                    </div>
                  </div>

                  <div className="insight-item">
                    <span className="insight-emoji">💚</span>
                    <div>
                      <strong>
                        Your audience's positive reactions
                      </strong>
                      <p>
                        {positiveCount} of {totalComments} comments
                        are positive.
                      </p>
                    </div>
                  </div>

                  <div className="insight-item">
                    <span className="insight-emoji">❤️</span>
                    <div>
                      <strong>Emoji activity</strong>
                      <p>
                        {totalEmojis} emoji instances were found in
                        the current comments.
                      </p>
                    </div>
                  </div>

                  <div className="insight-item">
                    <span className="insight-emoji">💡</span>
                    <div>
                      <strong>Review constructive criticism</strong>
                      <p>
                        {negativeCount} negative and {neutralCount}{" "}
                        neutral comments may offer useful feedback.
                      </p>
                    </div>
                  </div>

                  <div className="insight-footer">
                    <ArrowUpRight size={15} />
                    {analysisData
                      ? "Insights are based on fetched YouTube comments"
                      : "Insights are based on demonstration data"}
                  </div>
                </div>
              </section>
            </>
          )}

          {activePage === "Comments" && (
            <section className="panel section-panel">
              <div className="section-toolbar">
                <div>
                  <h2>Comment Explorer</h2>
                  <p>
                    Search comments and filter by sentiment.
                  </p>
                </div>

                <input
                  className="comment-search"
                  placeholder="Search comments..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>

              <div className="filter-row">
                {["All", "Positive", "Neutral", "Negative"].map(
                  (item) => (
                    <button
                      key={item}
                      onClick={() => setFilter(item)}
                      className={`filter-button ${
                        filter === item ? "selected" : ""
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}
              </div>

              <RecentComments comments={comments} />
            </section>
          )}

          {activePage === "Emoji Analysis" && (
            <section className="section-panel">
              <EmojiChart data={currentEmojiData} />

              <div className="emoji-gallery">
                {currentEmojiData.map((item) => (
                  <div className="emoji-tile" key={item.emoji}>
                    <span>{item.emoji}</span>
                    <strong>{item.count}</strong>
                    <small>
                      {analysisData ? "actual uses" : "sample uses"}
                    </small>
                  </div>
                ))}

                {currentEmojiData.length === 0 && (
                  <p className="chart-note">
                    No emojis were found in the current comments.
                  </p>
                )}
              </div>
            </section>
          )}

          {activePage === "Sentiment Analysis" && (
            <section className="section-panel">
              <SentimentPieChart data={sentimentForChart} />

              <div className="panel explanatory-panel">
                <h2>Understanding sentiment</h2>

                <p>
                  <strong>Positive:</strong> Comments expressing
                  approval, happiness, or excitement.
                </p>

                <p>
                  <strong>Neutral:</strong> Comments that are
                  relatively factual or have mixed signals.
                </p>

                <p>
                  <strong>Negative:</strong> Comments expressing
                  disappointment, frustration, or criticism.
                </p>

                <p className="chart-note">
                  {analysisData
                    ? "These results were analysed using Python and VADER."
                    : "Connect to a YouTube video to display live sentiment results. Demo results are shown until then."}
                </p>
              </div>
            </section>
          )}

          {activePage === "Charts & Reports" && (
            <section className="section-panel charts-grid">
              <SentimentPieChart data={sentimentForChart} />

              <EmojiChart data={currentEmojiData} />

              <div className="chart-card">
                <div className="chart-heading">
                  <h3>Report summary</h3>
                </div>

                <p>Positive: {positiveCount}</p>
                <p>Neutral: {neutralCount}</p>
                <p>Negative: {negativeCount}</p>
                <p>Total comments: {totalComments}</p>
                <p>Total emoji instances: {totalEmojis}</p>
                <p>Average VADER compound: {averageScore.toFixed(2)}</p>
              </div>
            </section>
          )}

          {activePage === "Export Data" && (
            <section className="panel section-panel">
              <h2>
                {analysisData
                  ? "Export YouTube analysis"
                  : "Export demonstration comments"}
              </h2>

              <p className="page-subtitle">
                {analysisData
                  ? `Download the ${totalComments} analysed comments as a CSV file.`
                  : "Download the current sample comments as a CSV file."}
              </p>

              <button
                className="analyze-button export-button"
                onClick={exportComments}
                disabled={dashboardComments.length === 0}
              >
                <MessageCircle size={17} />
                {analysisData
                  ? "Export analysis CSV"
                  : "Export sample CSV"}
              </button>

              <p className="chart-note">
                {analysisData
                  ? "The export includes comment text, sentiment, VADER scores, emojis, likes, and publication dates."
                  : "This file contains sample data, not comments fetched from YouTube."}
              </p>
            </section>
          )}

          <footer className="main-footer">
            <span>TubeCentrix © 2026</span>
            <span>Analyze · Understand · Engage</span>
            <span>
              <span className="status-dot" />
              {analysisData ? "Live analysis mode" : "Demo mode"}
            </span>
          </footer>
        </div>
      </main>
    </div>
  );
}
