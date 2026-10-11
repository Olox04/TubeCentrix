export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "pink",
}) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}>
        <Icon size={21} />
      </div>

      <div className="stat-content">
        <p>{title}</p>
        <h2>{value}</h2>
        <span>{subtitle}</span>
      </div>
    </div>
  );
}