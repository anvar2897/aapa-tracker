type Props = {
  score: number;
  size?: number;
};

type ScoreColor = 'red' | 'yellow' | 'blue' | 'green';

const colorHex: Record<ScoreColor, string> = {
  red: '#ef4444',
  yellow: '#eab308',
  blue: '#3b82f6',
  green: '#22c55e',
};

function getColor(score: number): ScoreColor {
  if (score <= 49) return 'red';
  if (score <= 69) return 'yellow';
  if (score <= 89) return 'blue';
  return 'green';
}

export function ScoreBadge({ score, size = 44 }: Props) {
  const strokeWidth = 3.5;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset =
    circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;
  const color = colorHex[getColor(score)];
  const center = size / 2;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`Score: ${score}`}
    >
      {/* Track ring */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={strokeWidth}
      />
      {/* Progress ring */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        transform={`rotate(-90 ${center} ${center})`}
      />
      {/* Score number */}
      <text
        x={center}
        y={center}
        textAnchor="middle"
        dominantBaseline="central"
        fill="white"
        fontSize={size * 0.28}
        fontFamily="var(--font-geist-mono), monospace"
        fontWeight="600"
      >
        {score}
      </text>
    </svg>
  );
}
