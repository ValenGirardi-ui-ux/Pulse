"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useLang, useT } from "../../i18n";
import { secondaryButtonClass } from "../styles";
import { removeSite } from "./actions";

export function RemoveSite({ siteId, site }: { siteId: string; site: string }) {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const noRef = useRef<HTMLButtonElement>(null);
  const t = useT();
  const lang = useLang();
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);

  function confirm() {
    setFailed(false);
    startTransition(async () => {
      const result = await removeSite(siteId);
      if (result.ok) setOpen(false);
      else setFailed(true);
    });
  }

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => setShown(true));
    noRef.current?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKey);
      setShown(false);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-8 shrink-0 items-center rounded-full border border-red-200 bg-white px-3 text-xs font-medium text-red-600 transition-colors hover:border-red-600 hover:bg-red-600 hover:text-white"
      >
        {t("Remove site", "Eliminar sitio")}
      </button>

      {open && (
        <div
          className={`fixed inset-0 z-40 flex items-start justify-center bg-[#0f1a2e]/20 px-4 py-[20vh] backdrop-blur-[2px] transition-opacity duration-200 ${
            shown ? "opacity-100" : "opacity-0"
          }`}
          onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="remove-site-title"
            aria-describedby="remove-site-description"
            className={`w-full max-w-sm rounded-2xl border border-[#ececf1] bg-white shadow-[0_24px_60px_rgba(15,26,46,0.18)] transition-transform duration-200 ease-out ${
              shown ? "translate-y-0 scale-100" : "translate-y-2 scale-[0.98]"
            }`}
          >
            <div className="px-5 py-5">
              <h2 id="remove-site-title" className="text-sm font-semibold">
                {t("Are you sure?", "¿Querés eliminarlo?")}
              </h2>
              <p id="remove-site-description" className="mt-1.5 text-xs leading-5 text-[#5b6478]">
                {lang === "es" ? (
                  <>
                    Se va a eliminar <span className="font-medium text-[#0f1a2e]">{site}</span> junto con todos sus
                    escaneos e historial. No se puede deshacer.
                  </>
                ) : (
                  <>
                    This will remove <span className="font-medium text-[#0f1a2e]">{site}</span> along with all its
                    scans and history. This can&apos;t be undone.
                  </>
                )}
              </p>
              {failed && (
                <p role="alert" className="mt-2 text-xs text-red-600">
                  {t("We couldn't remove the site. Try again.", "No pudimos eliminar el sitio. Probá de nuevo.")}
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t border-[#f1f2f6] px-5 py-3.5">
              <button ref={noRef} type="button" onClick={() => setOpen(false)} className={secondaryButtonClass}>
                {t("No", "No")}
              </button>
              <button
                type="button"
                onClick={confirm}
                disabled={pending}
                className="inline-flex h-8 items-center rounded-full bg-red-600 px-3.5 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-wait disabled:opacity-70"
              >
                {pending ? t("Removing…", "Eliminando…") : t("Yes, remove", "Sí, eliminar")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
