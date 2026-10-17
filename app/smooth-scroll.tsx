"use client";

import { useEffect } from "react";

const EASE = 0.07;
const WHEEL_SPEED = 0.55;
const LINE_HEIGHT = 16;

export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const root = document.documentElement;
    let target = window.scrollY;
    let current = window.scrollY;
    let frame = 0;
    let running = false;

    function maxScroll() {
      return Math.max(0, root.scrollHeight - window.innerHeight);
    }

    function step() {
      current += (target - current) * EASE;

      if (Math.abs(target - current) < 0.5) {
        current = target;
        running = false;
      }

      window.scrollTo(0, current);
      if (running) frame = requestAnimationFrame(step);
    }

    function onWheel(event: WheelEvent) {
      if (event.ctrlKey || root.style.overflow === "hidden") return;
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;

      event.preventDefault();

      if (!running) {
        target = window.scrollY;
        current = window.scrollY;
      }

      const delta = event.deltaMode === 1 ? event.deltaY * LINE_HEIGHT : event.deltaY;
      target = Math.min(maxScroll(), Math.max(0, target + delta * WHEEL_SPEED));

      if (!running) {
        running = true;
        frame = requestAnimationFrame(step);
      }
    }

    function onScroll() {
      if (running) return;
      target = window.scrollY;
      current = window.scrollY;
    }

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
