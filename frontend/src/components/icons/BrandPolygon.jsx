export default function BrandPolygon() {
  return (
    <span className="brand-mark brand-tri-pin" aria-hidden="true">
      <svg viewBox="0 0 64 64">
        <path
          className="tri-pin-a"
          d="M20 9c-6.4 0-11.5 5.1-11.5 11.5C8.5 30.7 20 42 20 42s11.5-11.3 11.5-21.5C31.5 14.1 26.4 9 20 9Z"
        />
        <circle className="tri-pin-hole" cx="20" cy="20.5" r="3.4" />
        <path className="tri-route" d="M24 43c6.2-7.3 12.4-6.1 17.1-1.7" />
        <path
          className="tri-pin-b"
          d="M45 26c-5.8 0-10.5 4.7-10.5 10.5C34.5 45.8 45 56 45 56s10.5-10.2 10.5-19.5C55.5 30.7 50.8 26 45 26Z"
        />
        <circle className="tri-pin-hole" cx="45" cy="36.5" r="3.1" />
      </svg>
    </span>
  );
}
