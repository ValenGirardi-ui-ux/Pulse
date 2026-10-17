"use client";

import { useEffect, useRef, useState } from "react";
import { Sora } from "next/font/google";

const pulse = Sora({
  weight: ["400", "600"],
  subsets: ["latin"],
});

const FADE_MS = 300;

export function LoginDialog({ className }: { className: string }) {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const closeTimer = useRef(0);

  function openDialog() {
    window.clearTimeout(closeTimer.current);
    setOpen(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
  }

  function closeDialog() {
    setShown(false);
    closeTimer.current = window.setTimeout(() => setOpen(false), FADE_MS);
  }

  useEffect(() => {
    if (!open) return;

    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") closeDialog();
    }

    window.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  return (
    <>
      <button type="button" className={className} onClick={openDialog}>
        Log in
      </button>
      {open ? (
        <div
          className={`${pulse.className} fixed inset-0 z-30 overflow-y-auto bg-white text-black transition-opacity duration-300 ease-out motion-reduce:transition-none ${
            shown ? "opacity-100" : "opacity-0"
          }`}
        >
          <button
            type="button"
            onClick={closeDialog}
            className="absolute top-5 right-6 text-sm text-neutral-500 transition-colors duration-200 hover:text-black"
          >
            Close
          </button>
          <div
            className={`mx-auto flex min-h-full w-full max-w-[27rem] flex-col items-center justify-center px-5 py-8 transition-transform duration-300 ease-out motion-reduce:transition-none ${
              shown ? "translate-y-0" : "translate-y-3"
            }`}
          >
            <div className="size-16 rounded-full bg-neutral-300" aria-hidden="true" />
            <h2 className="mt-4 text-2xl font-semibold tracking-tight">Log in</h2>
            <form
              className="mt-6 w-full"
              onSubmit={(event) => event.preventDefault()}
            >
              <label className="block text-sm font-semibold" htmlFor="login-email">
                Username or email address
              </label>
              <input
                id="login-email"
                name="email"
                type="text"
                autoComplete="username"
                className="mt-2 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
              />
              <div className="mt-4 flex items-center justify-between">
                <label className="text-sm font-semibold" htmlFor="login-password">
                  Password
                </label>
                <button type="button" className="text-sm text-blue-600">
                  Forgot password?
                </button>
              </div>
              <input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                className="mt-2 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
              />
              <button
                type="submit"
                className="mt-4 w-full rounded-xl bg-[#4c2882] py-2.5 text-sm font-semibold text-white"
              >
                Log in
              </button>
            </form>
            <div className="relative my-4 w-full">
              <div className="border-t border-neutral-300" />
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-sm text-neutral-600">
                or
              </span>
            </div>
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-neutral-100 py-2 text-sm font-semibold"
            >
              <GoogleMark />
              Continue with Google
            </button>
            <button
              type="button"
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-neutral-100 py-2 text-sm font-semibold"
            >
              <AppleMark />
              Continue with Apple
            </button>
            <p className="mt-6 text-sm">
              New to Pulse?{" "}
              <button type="button" className="text-blue-600">
                Create an account
              </button>
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.6 9.2c0-.6-.1-1.2-.2-1.8H9v3.4h4.8c-.2 1.1-.8 2.1-1.8 2.7v2.2h2.9c1.7-1.6 2.7-3.9 2.7-6.5z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.6-1.9.9-3.1.9-2.4 0-4.4-1.6-5.1-3.8H.9v2.3C2.4 16 5.5 18 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.9 10.7c-.2-.6-.3-1.2-.3-1.7s.1-1.2.3-1.7V5H.9C.3 6.2 0 7.6 0 9s.3 2.8.9 4l3-2.3z"
      />
      <path
        fill="#EA4335"
        d="M9 3.6c1.3 0 2.5.5 3.4 1.3l2.6-2.6C13.5.9 11.4 0 9 0 5.5 0 2.4 2 0.9 5l3 2.3C4.6 5.2 6.6 3.6 9 3.6z"
      />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg width="14" height="16" viewBox="0 0 14 17" aria-hidden="true">
      <path
        fill="currentColor"
        d="M11.4 8.9c0-2.2 1.8-3.2 1.9-3.3-1-1.5-2.6-1.7-3.2-1.7-1.4-.1-2.6.8-3.3.8s-1.7-.8-2.9-.8c-1.5 0-2.8.9-3.6 2.2-1.5 2.7-.4 6.6 1.1 8.8.7 1.1 1.6 2.3 2.7 2.2 1.1 0 1.5-.7 2.8-.7s1.7.7 2.9.7 1.9-1.1 2.6-2.1c.8-1.2 1.1-2.3 1.2-2.4-.1 0-2.2-.8-2.2-3.7zM9.5 2.6c.6-.7 1-1.7.9-2.6-.9 0-1.9.6-2.5 1.3-.6.6-1.1 1.6-.9 2.6 1 .1 1.9-.5 2.5-1.3z"
      />
    </svg>
  );
}
