'use client';

import { useEffect, useState } from 'react';

// Hotel time, whatever the time zone of the computer the admin is using.
const TIME_ZONE = 'Asia/Colombo';

const dateFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: TIME_ZONE,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const timeFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  hour: 'numeric',
  minute: '2-digit',
  second: '2-digit',
  hour12: true,
});

export default function AdminClock() {
  // Starts empty so the server-rendered page and the browser never disagree about the time.
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={`flex flex-col text-right transition-opacity ${now ? 'opacity-100' : 'opacity-0'}`}>
      <span className="text-sm font-semibold text-slate-700">{now ? dateFormat.format(now) : '—'}</span>
      <span className="text-xs text-slate-500 tabular-nums">{now ? timeFormat.format(now) : '—'}</span>
    </div>
  );
}
