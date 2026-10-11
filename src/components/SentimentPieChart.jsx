import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export default function SentimentPieChart({ data }) {
  return (
    <div className="chart-card">
      <div className="chart-heading">
        <div>
          <span className="chart-symbol">◔</span>
          <h3>Sentiment Distribution</h3>
        </div>
        <span className="chart-tag">Comments</span>
      </div>

      <div className="pie-layout">
        <div className="pie-visual">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={0}
                outerRadius={88}
                paddingAngle={2}
                stroke="none"
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [`${value}%`, "Comments"]}
                contentStyle={{
                  background: "#111D30",
                  border: "1px solid #293950",
                  borderRadius: "10px",
                  color: "#fff",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-legend">
          {data.map((item) => (
            <div className="legend-item" key={item.name}>
              <span
                className="legend-dot"
                style={{ background: item.color }}
              />
              <span>{item.name}</span>
              <strong>{item.value}%</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}