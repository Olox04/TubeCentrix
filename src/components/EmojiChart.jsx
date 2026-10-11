import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function EmojiChart({ data }) {
  return (
    <div className="chart-card">
      <div className="chart-heading">
        <div>
          <span className="chart-symbol">☺</span>
          <h3>Emoji Usage</h3>
        </div>
        <span className="chart-tag">Top emojis</span>
      </div>

      <ResponsiveContainer width="100%" height={255}>
        <BarChart
          data={data}
          margin={{ top: 15, right: 5, left: -18, bottom: 4 }}
        >
          <CartesianGrid
            stroke="#23334A"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="emoji"
            tick={{ fill: "#E8EEF9", fontSize: 20 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#91A1B9", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "#111D30",
              border: "1px solid #293950",
              borderRadius: "10px",
              color: "#fff",
            }}
          />
          <Bar
            dataKey="count"
            name="Uses"
            fill="#F32D64"
            radius={[6, 6, 0, 0]}
            maxBarSize={34}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}