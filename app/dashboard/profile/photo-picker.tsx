"use client";

import { useRef, useState, useTransition, type ChangeEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { useT } from "../../i18n";
import { secondaryButtonClass } from "../styles";
import { removeAvatar, setAvatar } from "./photo-actions";

const MAX_MB = 5;
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/gif": "gif", "image/webp": "webp" };

export type PhotoUser = { id: string; initial: string; photoUrl: string | null; hasCustomPhoto: boolean };

export function PhotoPicker({ user }: { user: PhotoUser }) {
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const t = useT();

  const failed = t("We couldn't save the photo. Try again.", "No pudimos guardar la foto. Probá de nuevo.");
  const photo = preview ?? user.photoUrl;

  function choose(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const extension = TYPES[file.type];
    if (!extension) {
      setError(t("Choose a JPG, PNG, GIF or WebP image.", "Elegí una imagen JPG, PNG, GIF o WebP."));
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(t(`The photo must be smaller than ${MAX_MB} MB.`, `La foto tiene que pesar menos de ${MAX_MB} MB.`));
      return;
    }

    setError(null);
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);

    startTransition(async () => {
      const path = `${user.id}/${Date.now()}.${extension}`;
      const { error: uploadError } = await createClient()
        .storage.from("avatars")
        .upload(path, file, { contentType: file.type, cacheControl: "3600" });
      const result = uploadError ? { error: true } : await setAvatar(path);
      if (result.error) setError(failed);
      setPreview(null);
      URL.revokeObjectURL(localUrl);
    });
  }

  function remove() {
    setError(null);
    startTransition(async () => {
      const result = await removeAvatar();
      if (result.error) setError(failed);
    });
  }

  return (
    <div>
      <div className="flex items-center gap-4">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element -- photo from Supabase Storage or Google
          <img
            src={photo}
            alt={t("Your profile photo", "Tu foto de perfil")}
            referrerPolicy="no-referrer"
            className={`size-14 rounded-full object-cover transition-opacity ${pending ? "opacity-60" : ""}`}
          />
        ) : (
          <span className="flex size-14 items-center justify-center rounded-full bg-[#0f1a2e] text-lg font-medium text-white">
            {user.initial}
          </span>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => inputRef.current?.click()}
            className={`${secondaryButtonClass} disabled:opacity-60`}
          >
            {pending
              ? t("Saving…", "Guardando…")
              : photo
                ? t("Change photo", "Cambiar foto")
                : t("Upload photo", "Subir foto")}
          </button>
          {user.hasCustomPhoto && !pending && (
            <button
              type="button"
              onClick={remove}
              className="h-8 px-2 text-xs font-medium text-[#8a91a3] transition-colors hover:text-[#0f1a2e]"
            >
              {t("Remove", "Quitar")}
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={Object.keys(TYPES).join(",")}
          onChange={choose}
          className="hidden"
        />
      </div>
      <p role={error ? "alert" : undefined} className={`mt-2.5 text-xs ${error ? "text-red-600" : "text-[#8a91a3]"}`}>
        {error ?? t(`JPG, PNG, GIF or WebP, up to ${MAX_MB} MB.`, `JPG, PNG, GIF o WebP, hasta ${MAX_MB} MB.`)}
      </p>
    </div>
  );
}
