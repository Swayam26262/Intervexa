"use client";

import { useEffect, useState } from "react";

function partOfDay(hour: number) {
  if (hour < 5) return "Good evening";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/** Time-of-day greeting computed in the viewer's timezone. */
export function Greeting({ name }: { name: string }) {
  const [greeting, setGreeting] = useState("Hello");
  useEffect(() => setGreeting(partOfDay(new Date().getHours())), []);
  return (
    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
      {greeting}, {name} 👋
    </h1>
  );
}
