import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "MementoRoll — Every Moment Deserves a Frame", template: "%s | MementoRoll" },
  description: "A digital disposable camera for the candid moments your guests see.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
