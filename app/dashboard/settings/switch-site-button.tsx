"use client";

import { useTransition } from "react";
import { useT } from "../../i18n";
import { secondaryButtonClass } from "../styles";
import { selectSite } from "../site-actions";

export function SwitchSiteButton({ siteId }: { siteId: string }) {
  const [pending, startTransition] = useTransition();
  const t = useT();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => selectSite(siteId))}
      className={`${secondaryButtonClass} disabled:opacity-60`}
    >
      {pending ? t("Switching…", "Cambiando…") : t("Switch to this site", "Ver este sitio")}
    </button>
  );
}
