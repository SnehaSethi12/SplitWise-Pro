import { barPct, centsToMoney } from "@/lib/format";

export function HorizontalChart({ data }: { data: Record<string, number> }) {
  const items = Object.entries(data)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, 8);
  const max = Math.max(...items.map(([, v]) => Math.abs(v)), 1);
  return (
    <div className="hbar-chart">
      {items.map(([name, value]) => (
        <div className="hbar-row" key={name}>
          <label>{name}</label>
          <div className="hbar-track">
            <span
              className={value >= 0 ? "pos" : "neg"}
              style={{ width: `${barPct(Math.abs(value), max)}%` }}
            />
          </div>
          <b className={value >= 0 ? "pos" : "neg"}>{centsToMoney(value)}</b>
        </div>
      ))}
    </div>
  );
}

export function BarChart({ data }: { data: Record<string, number> }) {
  const items = Object.entries(data).slice(0, 8);
  const max = Math.max(...items.map(([, v]) => v), 1);
  return (
    <svg className="chart-svg" viewBox="0 0 720 260" role="img">
      <line x1="42" y1="216" x2="710" y2="216" stroke="#d5c7b4" />
      {items.map(([label, value], i) => {
        const left = 42,
          bottom = 44,
          top = 20,
          chartH = 260 - top - bottom,
          gap = 16;
        const barW = Math.max(
          24,
          (720 - left - 24 - gap * (items.length - 1)) / items.length,
        );
        const h = Math.max(4, (value / max) * chartH),
          x = left + i * (barW + gap),
          y = 260 - bottom - h;
        return (
          <g key={label}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={h}
              rx="8"
              fill="#597262"
              opacity=".92"
            >
              <title>
                {label}: {centsToMoney(value)}
              </title>
            </rect>
            <text
              x={x + barW / 2}
              y="242"
              textAnchor="middle"
              fontSize="13"
              fill="#5f5b53"
            >
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function DonutChart({ data }: { data: Record<string, number> }) {
  const items = Object.entries(data)
    .filter(([, v]) => v)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7);
  const colors = [
    "#597262",
    "#8f5f35",
    "#a67530",
    "#6b7280",
    "#3f6f8f",
    "#9b5552",
    "#7b6d8d",
  ];
  const total = items.reduce((a, [, v]) => a + v, 0) || 1;
  let start = 0;
  const stops = items
    .map(([_, value], i) => {
      const deg = (value / total) * 360;
      const stop = `${colors[i]} ${start.toFixed(1)}deg ${(start + deg).toFixed(1)}deg`;
      start += deg;
      return stop;
    })
    .join(", ");
  return (
    <div className="donut-wrap">
      <div className="donut" style={{ background: `conic-gradient(${stops})` }}>
        <strong>{centsToMoney(total)}</strong>
        <small>total</small>
      </div>
      <div className="legend">
        {items.map(([label, value], i) => (
          <div className="legend-row" key={label}>
            <span style={{ background: colors[i] }} />
            <b>{label}</b>
            <em>{((value / total) * 100).toFixed(1)}%</em>
          </div>
        ))}
      </div>
    </div>
  );
}
