import type { ReactNode } from "react";
import { EventPhotosProvider } from "./event-state";

export default function EventLayout({ children }: { children: ReactNode }) {
  return <EventPhotosProvider>{children}</EventPhotosProvider>;
}
