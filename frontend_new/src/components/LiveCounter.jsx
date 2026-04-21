import { useEffect, useRef, useState } from "react";

// Ticks a decimal value up every `interval` ms by `ratePerSecond`.
// Purely cosmetic — used on the marketing hero.
export default function LiveCounter({
  start = 12500,
  ratePerSecond = 0.0423,
  decimals = 6,
  interval = 80,
  className = "",
  prefix = "",
  suffix = "",
}) {
  const [val, setVal] = useState(start);
  const lastRef = useRef(performance.now());

  useEffect(() => {
    const id = setInterval(() => {
      const now = performance.now();
      const dt = (now - lastRef.current) / 1000;
      lastRef.current = now;
      setVal((v) => v + ratePerSecond * dt);
    }, interval);
    return () => clearInterval(id);
  }, [ratePerSecond, interval]);

  const [intPart, decPart] = val.toFixed(decimals).split(".");
  const intFormatted = Number(intPart).toLocaleString("en-US");

  return (
    <span className={`ticker ${className}`}>
      {prefix}
      {intFormatted}
      {decimals > 0 && (
        <span className="opacity-60">.{decPart}</span>
      )}
      {suffix}
    </span>
  );
}
