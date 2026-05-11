interface DayPoint {
  date: string;
  count: number;
}

interface Props {
  data: DayPoint[];
  height?: number;
}

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dowLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return DOW[d.getUTCDay()] ?? "";
}

export function ResumesPerDayChart({ data, height = 220 }: Props) {
  const width = 600;
  const padL = 40;
  const padR = 16;
  const padT = 16;
  const padB = 36;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;

  const counts = data.map((d) => d.count);
  const maxY = Math.max(1, ...counts);
  const niceMax = maxY <= 5 ? maxY : Math.ceil(maxY / 5) * 5;

  const xFor = (i: number) =>
    padL + (data.length <= 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const yFor = (v: number) => padT + innerH - (v / niceMax) * innerH;

  const points = data.map((d, i) => ({ x: xFor(i), y: yFor(d.count), d }));
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaPath =
    points.length > 0
      ? `${linePath} L${points[points.length - 1].x.toFixed(1)},${(padT + innerH).toFixed(1)} L${points[0].x.toFixed(1)},${(padT + innerH).toFixed(1)} Z`
      : "";

  const yTicks = [0, Math.ceil(niceMax / 2), niceMax].filter((v, i, a) => a.indexOf(v) === i);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Resumes generated per day"
      className="w-full"
    >
      {/* gridlines + y-axis ticks */}
      {yTicks.map((v) => (
        <g key={v}>
          <line
            x1={padL}
            x2={width - padR}
            y1={yFor(v)}
            y2={yFor(v)}
            stroke="currentColor"
            strokeOpacity="0.08"
          />
          <text
            x={padL - 8}
            y={yFor(v) + 4}
            textAnchor="end"
            fontSize="11"
            fill="currentColor"
            fillOpacity="0.5"
          >
            {v}
          </text>
        </g>
      ))}
      {/* area under line */}
      <path d={areaPath} fill="var(--accent, #2563eb)" fillOpacity="0.12" />
      {/* line */}
      <path d={linePath} fill="none" stroke="var(--accent, #2563eb)" strokeWidth="2" />
      {/* dots */}
      {points.map((p, i) => (
        <g key={i}>
          <circle
            cx={p.x}
            cy={p.y}
            r="3.5"
            fill="var(--accent, #2563eb)"
            stroke="white"
            strokeWidth="1.5"
          >
            <title>{`${p.d.date} — ${p.d.count} ${p.d.count === 1 ? "resume" : "resumes"}`}</title>
          </circle>
        </g>
      ))}
      {/* x-axis labels */}
      {points.map((p, i) => (
        <text
          key={i}
          x={p.x}
          y={height - 12}
          textAnchor="middle"
          fontSize="11"
          fill="currentColor"
          fillOpacity="0.55"
        >
          {dowLabel(p.d.date)}
        </text>
      ))}
    </svg>
  );
}
