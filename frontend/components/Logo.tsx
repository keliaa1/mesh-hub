export default function Logo({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M12 1.5 21.5 7v10L12 22.5 2.5 17V7L12 1.5Z" fill="#111111" />
      <path
        d="M12 1.5V22.5M2.5 7 12 12.5M21.5 7 12 12.5"
        stroke="#ffffff"
        strokeWidth="1.1"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
