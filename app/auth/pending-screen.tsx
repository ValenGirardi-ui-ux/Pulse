"use client";

import { useFormStatus } from "react-dom";
import { LoadingScreen } from "../loading-screen";

/**
 * Covers the page with the loading screen while the surrounding form is submitting.
 * When sign in succeeds the app navigates away, so the screen stays up until the dashboard is ready.
 */
export function PendingScreen({ en, es }: { en: string; es: string }) {
  const { pending } = useFormStatus();
  return pending ? <LoadingScreen en={en} es={es} /> : null;
}
