"use server";

import { refresh } from "next/cache";
import { rememberSite } from "@/lib/sites";

/** Makes `id` the site the dashboard shows. Ignored if it isn't one of the user's sites. */
export async function selectSite(id: string) {
  if (await rememberSite(id)) refresh();
}
