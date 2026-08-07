interface P {
  size?: number
}

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
})

export const Search = ({ size = 15 }: P) => (
  <svg {...base(size)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
)

export const Bookmark = ({ size = 16, filled = false }: P & { filled?: boolean }) => (
  <svg {...base(size)} fill={filled ? 'currentColor' : 'none'}>
    <path d="M6 4h12v17l-6-4-6 4Z" />
  </svg>
)

export const Check = ({ size = 12 }: P) => (
  <svg {...base(size)} strokeWidth={2.6} stroke="#fff">
    <path d="m4 12 5 5L20 6" />
  </svg>
)

export const CheckInk = ({ size = 14 }: P) => (
  <svg {...base(size)} strokeWidth={2}>
    <path d="m4 12 5 5L20 6" />
  </svg>
)

export const Close = ({ size = 17 }: P) => (
  <svg {...base(size)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
)

export const Plus = ({ size = 15 }: P) => (
  <svg {...base(size)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const Arrow = ({ size = 15 }: P) => (
  <svg {...base(size)}>
    <path d="M4 12h15m-6-6 6 6-6 6" />
  </svg>
)

export const Bag = ({ size = 16 }: P) => (
  <svg {...base(size)}>
    <path d="M5 8h14l-1 12H6Z" />
    <path d="M9 8V6a3 3 0 0 1 6 0v2" />
  </svg>
)

export const Hanger = ({ size = 16 }: P) => (
  <svg {...base(size)}>
    <path d="M12 9a2.5 2.5 0 1 1 2.5-2.5" />
    <path d="M12 9v2l8 5.5c1 .7.5 2.5-.8 2.5H4.8c-1.3 0-1.8-1.8-.8-2.5L12 11" />
  </svg>
)

export const Person = ({ size = 16 }: P) => (
  <svg {...base(size)}>
    <circle cx="12" cy="7.5" r="3.5" />
    <path d="M5 20c0-3.9 3.1-6.5 7-6.5s7 2.6 7 6.5" />
  </svg>
)

export const Grid = ({ size = 16 }: P) => (
  <svg {...base(size)}>
    <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />
  </svg>
)

export const Upload = ({ size = 22 }: P) => (
  <svg {...base(size)}>
    <path d="M12 16V4m-5 5 5-5 5 5" />
    <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
  </svg>
)

export const Trash = ({ size = 15 }: P) => (
  <svg {...base(size)}>
    <path d="M4 7h16M9 7V5h6v2m-8 0 1 13h8l1-13" />
  </svg>
)

export const External = ({ size = 14 }: P) => (
  <svg {...base(size)}>
    <path d="M14 4h6v6M20 4l-8 8" />
    <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
  </svg>
)

export const Sparkle = ({ size = 14 }: P) => (
  <svg {...base(size)}>
    <path d="M12 3.5 13.7 9l5.3 1.7-5.3 1.7L12 18l-1.7-5.6L5 10.7 10.3 9Z" />
  </svg>
)
