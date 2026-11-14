import { GoogleMark } from "../auth-marks";
import { T } from "../i18n";
import { signInWithGoogle } from "./actions";
import { PendingScreen } from "./pending-screen";

export function GoogleButton() {
  return (
    <form action={signInWithGoogle} className="w-full">
      <button
        type="submit"
        className="flex w-full items-center justify-center gap-2 rounded-full border border-black/[0.07] bg-white py-3 text-sm font-semibold shadow-[0_1px_4px_rgba(0,0,0,0.04)] transition-colors hover:border-[#4c2882]/35 sm:py-2"
      >
        <GoogleMark />
        <T en="Continue with Google" es="Continuar con Google" />
      </button>
      <PendingScreen en="Connecting to Google…" es="Conectando con Google…" />
    </form>
  );
}
