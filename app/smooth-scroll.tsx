"use client";

import { useEffect } from "react";

const DURATION_MS = 900;

function easeInOut(progress: number) {
  return progress < 0.5 ? 2 * progress * progress : 1 - (-2 * progress + 2) ** 2 / 2;
}

export function SmoothScroll() {
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let busy = false;
    let coolUntil = 0;

    function screens() {
      return [...document.querySelectorAll<HTMLElement>("[data-screen]")];
    }

    function currentIndex(list: HTMLElement[]) {
      const y = window.scrollY;
      let index = 0;
      let best = Number.POSITIVE_INFINITY;

      list.forEach((screen, i) => {
        const distance = Math.abs(screen.offsetTop - y);
        if (distance < best) {
          best = distance;
          index = i;
        }
      });

      return index;
    }

    function glideTo(top: number, duration = DURATION_MS) {
      cancelAnimationFrame(frame);
      const start = window.scrollY;
      const change = top - start;

      if (Math.abs(change) < 2) {
        busy = false;
        return;
      }

      if (media.matches) {
        window.scrollTo(0, top);
        busy = false;
        coolUntil = performance.now() + 350;
        return;
      }

      const started = performance.now();

      function step(now: number) {
        const progress = Math.min(1, (now - started) / duration);
        window.scrollTo(0, start + change * easeInOut(progress));

        if (progress < 1) {
          frame = requestAnimationFrame(step);
          return;
        }

        busy = false;
        coolUntil = performance.now() + 450;
      }

      frame = requestAnimationFrame(step);
    }

    function onWheel(event: WheelEvent) {
      const list = screens();
      if (list.length < 2) return;

      if (busy || performance.now() < coolUntil) {
        event.preventDefault();
        return;
      }

      if (Math.abs(event.deltaY) < 4) return;

      const index = currentIndex(list);
      const next = event.deltaY > 0 ? index + 1 : index - 1;
      if (next < 0 || next >= list.length) return;

      event.preventDefault();
      busy = true;
      glideTo(list[next].offsetTop);
    }

    function onClick(event: MouseEvent) {
      const link = (event.target as Element | null)?.closest("a");
      if (!link) return;

      const href = link.getAttribute("href");
      if (!href?.startsWith("#")) return;

      const target = document.querySelector<HTMLElement>(href);
      if (!target) return;

      event.preventDefault();
      event.stopPropagation();
      history.pushState(null, "", href);
      busy = true;
      glideTo(target.offsetTop);
    }

    window.addEventListener("wheel", onWheel, { passive: false });
    document.addEventListener("click", onClick, true);

    return () => {
      window.removeEventListener("wheel", onWheel);
      document.removeEventListener("click", onClick, true);
      cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
