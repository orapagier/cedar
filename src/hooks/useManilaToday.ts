import { useEffect, useState } from 'react';
import { manilaToday, msUntilNextManilaDay } from '../utils/date';

/**
 * Today's date (YYYY-MM-DD) in Asia/Manila, refreshed automatically when the
 * Manila day rolls over so a screen left open overnight is never stale.
 */
export const useManilaToday = () => {
  const [today, setToday] = useState(() => manilaToday());

  useEffect(() => {
    const timer = setTimeout(() => setToday(manilaToday()), msUntilNextManilaDay() + 1000);
    return () => clearTimeout(timer);
  }, [today]);

  return today;
};
