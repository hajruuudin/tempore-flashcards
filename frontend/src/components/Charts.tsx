import { DailyActivityPoint, MonthlyActivityPoint } from "@/types";

export function weekdayLabel(date: string): string {
  return new Date(`${date}T00:00:00`)
    .toLocaleDateString("en-US", { weekday: "short" })
    .toUpperCase();
}

export function monthLabel(month: string): string {
  return new Date(`${month}-01T00:00:00`)
    .toLocaleDateString("en-US", { month: "short" })
    .toUpperCase();
}

const BAR_AREA_PX = 120;

function barHeight(value: number, max: number): number {
  if (value <= 0) return 4;
  return Math.max(8, Math.round((value / max) * BAR_AREA_PX));
}

function Bar({
  value,
  max,
  color,
  title,
}: {
  value: number;
  max: number;
  color: string;
  title: string;
}) {
  return (
    <div
      title={title}
      style={{ height: barHeight(value, max) }}
      className={`w-2 rounded-full transition-all sm:w-2.5 ${color}`}
    />
  );
}

export function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      {label}
    </span>
  );
}

export function AnswerBars({
  days,
  showLegend = false,
}: {
  days: DailyActivityPoint[];
  showLegend?: boolean;
}) {
  const max = Math.max(
    1,
    ...days.flatMap((d) => [d.easyCount ?? 0, d.normalCount ?? 0, d.hardCount ?? 0])
  );

  return (
    <div>
      <div className="flex items-end justify-between gap-1">
        {days.map((d) => (
          <div key={d.date} className="flex flex-1 flex-col items-center gap-2">
            <div
              className="flex items-end gap-1"
              style={{ height: BAR_AREA_PX }}
            >
              <Bar
                value={d.easyCount ?? 0}
                max={max}
                color="bg-tf-lime"
                title={`${d.easyCount ?? 0} right`}
              />
              <Bar
                value={d.normalCount ?? 0}
                max={max}
                color="bg-tf-peach"
                title={`${d.normalCount ?? 0} half-answers`}
              />
              <Bar
                value={d.hardCount ?? 0}
                max={max}
                color="bg-tf-salmon"
                title={`${d.hardCount ?? 0} wrong`}
              />
            </div>
            <span className="text-[10px] font-bold text-white">
              {weekdayLabel(d.date)}
            </span>
          </div>
        ))}
      </div>
      {showLegend && (
        <div className="mt-4 flex justify-center gap-4">
          <LegendDot color="bg-tf-lime" label="Right" />
          <LegendDot color="bg-tf-peach" label="Half-answer" />
          <LegendDot color="bg-tf-salmon" label="Wrong" />
        </div>
      )}
    </div>
  );
}

export function MonthBars({ months }: { months: MonthlyActivityPoint[] }) {
  const max = Math.max(
    1,
    ...months.flatMap((m) => [m.reviewsCount, m.cardsAddedCount])
  );

  return (
    <div>
      <div className="flex items-end justify-between gap-1">
        {months.map((m) => (
          <div key={m.month} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex items-end gap-1.5" style={{ height: BAR_AREA_PX }}>
              <Bar
                value={m.cardsAddedCount}
                max={max}
                color="bg-tf-mint"
                title={`${m.cardsAddedCount} cards added`}
              />
              <Bar
                value={m.reviewsCount}
                max={max}
                color="bg-tf-blue"
                title={`${m.reviewsCount} cards reviewed`}
              />
            </div>
            <span className="text-[10px] font-bold text-white">
              {monthLabel(m.month)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-4">
        <LegendDot color="bg-tf-blue" label="Number of cards reviewed" />
        <LegendDot color="bg-tf-mint" label="Number of cards added" />
      </div>
    </div>
  );
}

const SVG_W = 700;
const SVG_H = 220;
const PAD_Y = 24;

function pointColor(value: number, min: number, max: number): string {
  if (max === min) return "#a5d6a7";
  const ratio = (value - min) / (max - min);
  if (ratio < 0.34) return "#f48fb1";
  if (ratio < 0.67) return "#ffcc80";
  return "#a5d6a7";
}

export function LineChart({
  days,
  tall = false,
  yLabel,
}: {
  days: DailyActivityPoint[];
  tall?: boolean;
  yLabel?: string;
}) {
  const values = days.map((d) => d.reviewsCount);
  const max = Math.max(1, ...values);
  const min = Math.min(...values, 0);
  const n = Math.max(days.length, 1);
  const pts = days.map((d, i) => ({
    x: ((i + 0.5) / n) * SVG_W,
    y:
      SVG_H -
      PAD_Y -
      ((d.reviewsCount - min) / (max - min || 1)) * (SVG_H - PAD_Y * 2),
    color: pointColor(d.reviewsCount, min, max),
    value: d.reviewsCount,
    date: d.date,
  }));

  return (
    <div className="flex gap-2">
      {yLabel && (
        <span
          className="hidden text-xs font-bold tracking-wider text-white sm:block"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          {yLabel}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className={`w-full ${tall ? "max-h-[300px]" : "max-h-[180px]"}`}
          role="img"
          aria-label="Cards reviewed per day"
        >
          <defs>
            {pts.slice(1).map((p, i) => (
              <linearGradient
                key={p.date}
                id={`seg-${i}-${tall ? "t" : "c"}`}
                gradientUnits="userSpaceOnUse"
                x1={pts[i].x}
                y1={pts[i].y}
                x2={p.x}
                y2={p.y}
              >
                <stop offset="0" stopColor={pts[i].color} />
                <stop offset="1" stopColor={p.color} />
              </linearGradient>
            ))}
          </defs>
          <line
            x1={2}
            y1={4}
            x2={2}
            y2={SVG_H - 2}
            stroke="#b5e8f4"
            strokeWidth={3}
            strokeLinecap="round"
          />
          <line
            x1={2}
            y1={SVG_H - 2}
            x2={SVG_W}
            y2={SVG_H - 2}
            stroke="#b5e8f4"
            strokeWidth={3}
            strokeLinecap="round"
          />
          {pts.slice(1).map((p, i) => (
            <line
              key={p.date}
              x1={pts[i].x}
              y1={pts[i].y}
              x2={p.x}
              y2={p.y}
              stroke={`url(#seg-${i}-${tall ? "t" : "c"})`}
              strokeWidth={3}
              strokeLinecap="round"
            />
          ))}
          {pts.map((p) => (
            <circle key={p.date} cx={p.x} cy={p.y} r={tall ? 8 : 6} fill={p.color}>
              <title>{`${p.value} cards reviewed`}</title>
            </circle>
          ))}
        </svg>
        <div
          className="mt-2 grid text-[10px] font-bold text-white sm:text-xs"
          style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
        >
          {days.map((d) => (
            <span key={d.date} className="text-center">
              {weekdayLabel(d.date)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
