export default function Logo() {
  return (
    <div className="flex items-center justify-center bg-white">
      <svg
        viewBox="0 0 100 100"
        className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Triangle */}
        <polygon
          points="50,10 90,80 10,80"
          fill="none"
          stroke="black"
          strokeWidth="3"
        />

        {/* S (top text) */}
        <text
          x="50"
          y="40"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="18"
          fontWeight="bold"
          fill="black"
        >
          S
        </text>

        {/* S W (bottom text) */}
        <text
          x="50"
          y="60"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="18"
          fontWeight="bold"
          fill="black"
        >
          S W
        </text>
      </svg>
    </div>
  )
}
