import type { Metadata } from "next";
import { MonitorsView } from "./monitors-view";

export const metadata: Metadata = {
  title: "Monitors · Pulse",
};

export default function MonitorsPage() {
  return <MonitorsView />;
}
