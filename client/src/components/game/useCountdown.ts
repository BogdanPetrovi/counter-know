import { useEffect, useState } from "react";

/** Milliseconds left until `deadline` (a local `Date.now()` value), refreshed a few times per second. */
export function useCountdown(deadline: number) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(t);
  }, []);

  return Math.max(0, deadline - now);
}
