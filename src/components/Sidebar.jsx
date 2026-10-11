
import {
  LayoutDashboard,
  MessageCircle,
  Smile,
  HeartPulse,
  BarChart3,
  Download,
  Play,
} from "lucide-react";

const navigation = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Comments", icon: MessageCircle },
  { label: "Emoji Analysis", icon: Smile },
  { label: "Sentiment Analysis", icon: HeartPulse },
  { label: "Charts & Reports", icon: BarChart3 },
  { label: "Export Data", icon: Download },
];

export default function Sidebar({ activePage, onNavigate }) {
  return (
    <aside className="sidebar">
      {/* TubeCentrix Brand */}
      <div className="sidebar-brand">
        <div className="brand-icon">
          <Play size={27} fill="white" />
        </div>

        <div>
          <h2>
            Tube<span>Centrix</span>
          </h2>
          <p>Understand your audience</p>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <nav className="sidebar-nav">
        {navigation.map(({ label, icon: Icon }) => (
          <button
            key={label}
            type="button"
            className={`nav-item ${
              activePage === label ? "active" : ""
            }`}
            onClick={() => onNavigate(label)}
          >
            <Icon size={19} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {/* Promotional Section */}
      <div className="sidebar-promo">
        <div className="promo-icon">
          <Play size={35} fill="white" />
        </div>

        <h3>Turn comments into insights.</h3>

        <p>
          Discover what viewers think, feel, and express
          through emojis.
        </p>

        <span className="promo-signature">
          TubeCentrix ✦
        </span>
      </div>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        <span className="status-dot" />
        Demo dashboard
      </div>
    </aside>
  );
}