import {
  BadgeDollarSign,
  CalendarCheck2,
  Hotel,
  Plane,
} from "lucide-react";

export default function TransitionIcon({ type }) {
  const Icon =
    type === "stay"
      ? Hotel
      : type === "budget"
        ? BadgeDollarSign
        : type === "flight"
          ? Plane
          : CalendarCheck2;

  return (
    <span
      className={`transition-icon transition-icon-${type}`}
      aria-hidden="true"
    >
      <Icon />
    </span>
  );
}
