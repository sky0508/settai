type Props = {
  score: number; // 0-100
  size?: number;
  badge: 'OK' | '注意' | 'NG';
};

const BADGE_COLOR: Record<string, string> = {
  OK:   '#2e9e5b',
  '注意': '#e0aa33',
  NG:   '#d95757',
};

export function ScoreDonut({ score, size = 48, badge }: Props) {
  const r = (size - 6) / 2;
  const cx = size / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - score / 100);
  const color = BADGE_COLOR[badge] ?? '#c2a15a';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      {/* 背景トラック */}
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="#e9e2d5" strokeWidth={4} />
      {/* スコア弧 */}
      <circle
        cx={cx} cy={cx} r={r}
        fill="none"
        stroke={color}
        strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${cx} ${cx})`}
      />
      {/* 中央テキスト */}
      <text
        x={cx} y={cx + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={size < 44 ? 9 : 11}
        fontWeight="700"
        fill={color}
      >
        {score}
      </text>
    </svg>
  );
}
