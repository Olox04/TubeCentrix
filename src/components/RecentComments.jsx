
import { MessageCircle, ThumbsUp } from "lucide-react";

export default function RecentComments({ comments }) {
  return (
    <div className="panel comments-panel">
      <div className="panel-heading">
        <div>
          <MessageCircle size={19} />
          <h3>Recent Comments</h3>
        </div>
        <span className="chart-tag">{comments.length} shown</span>
      </div>

      <div className="comments-list">
        {comments.map((comment) => (
          <div className="comment-row" key={comment.id}>
            <div className="avatar">
              {comment.username.replace("@", "").charAt(0).toUpperCase()}
            </div>

            <div className="comment-body">
              <div className="comment-meta">
                <strong>{comment.username}</strong>
                <span
                  className={`sentiment-badge ${comment.sentiment.toLowerCase()}`}
                >
                  {comment.sentiment}
                </span>
              </div>

              <p>{comment.text}</p>

              <span className="comment-likes">
                <ThumbsUp size={12} /> {comment.likes} likes
                <span className="comment-score">
                  VADER: {comment.compound.toFixed(2)}
                </span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}