import { useEffect, useRef, useState } from "react";

const IDLE_TIME = 5 * 60 * 1000;
const WARNING_TIME = 30 * 1000;

const events = ["mousemove","mousedown","keydown","scroll","touchstart"];

const useIdleLogout = (onLogout) => {
  const idleTimer = useRef(null);
  const warningTimer = useRef(null);
  const isLoggedOut = useRef(false);

  const [showWarning, setShowWarning] = useState(false);

  const clearTimers = () => {
    clearTimeout(idleTimer.current);
    clearTimeout(warningTimer.current);
  };

  const resetTimers = () => {
    if (isLoggedOut.current) return;

    clearTimers();
    setShowWarning(false);

    warningTimer.current = setTimeout(() => {
      setShowWarning(true);
    }, IDLE_TIME - WARNING_TIME);

    idleTimer.current = setTimeout(() => {
      isLoggedOut.current = true;
      onLogout();
    }, IDLE_TIME);
  };

  const stayLoggedIn = () => {
    resetTimers();   // fully restart timers
  };

  useEffect(() => {
    resetTimers();

    events.forEach(e => window.addEventListener(e, resetTimers));

    return () => {
      clearTimers();
      events.forEach(e => window.removeEventListener(e, resetTimers));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { showWarning, stayLoggedIn };
};

export default useIdleLogout;
