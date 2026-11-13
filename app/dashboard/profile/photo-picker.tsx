"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useT } from "../../i18n";
import { secondaryButtonClass } from "../styles";

const MAX_MB = 5;

export function PhotoPicker() {
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const t = useT();

  useEffect(() => {
    return () => {
      if (photo) URL.revokeObjectURL(photo);
    };
  }, [photo]);

  function choose(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError(t("Choose an image file, like a JPG or PNG.", "Elegí un archivo de imagen, como JPG o PNG."));
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(t(`The photo must be smaller than ${MAX_MB} MB.`, `La foto tiene que pesar menos de ${MAX_MB} MB.`));
      return;
    }
    setError(null);
    setPhoto(URL.createObjectURL(file));
  }

  return (
    <div>
      <div className="flex items-center gap-4">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element -- local preview from a blob URL
          <img src={photo} alt={t("Your profile photo", "Tu foto de perfil")} className="size-14 rounded-full object-cover" />
        ) : (
          <span className="flex size-14 items-center justify-center rounded-full bg-[#0f1a2e] text-lg font-medium text-white">
            P
          </span>
        )}
        <div className="flex gap-2">
          <button type="button" onClick={() => inputRef.current?.click()} className={secondaryButtonClass}>
            {photo ? t("Change photo", "Cambiar foto") : t("Upload photo", "Subir foto")}
          </button>
          {photo && (
            <button
              type="button"
              onClick={() => {
                setPhoto(null);
                setError(null);
              }}
              className="h-8 px-2 text-xs font-medium text-[#8a91a3] transition-colors hover:text-[#0f1a2e]"
            >
              {t("Remove", "Quitar")}
            </button>
          )}
        </div>
        <input ref={inputRef} type="file" accept="image/*" onChange={choose} className="hidden" />
      </div>
      <p className={`mt-2.5 text-xs ${error ? "text-red-600" : "text-[#8a91a3]"}`}>
        {error ?? t(`JPG, PNG or GIF, up to ${MAX_MB} MB.`, `JPG, PNG o GIF, hasta ${MAX_MB} MB.`)}
      </p>
    </div>
  );
}
