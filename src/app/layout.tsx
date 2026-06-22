import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";

import "./globals.css";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-instrument-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "InnoPulse Scheduling",
    template: "%s · InnoPulse Scheduling",
  },
  description: "Enterprise scheduling by The Growth System.",
  icons: {
    icon: "/branding/innopulse-growth-arrows.png",
    apple: "/branding/innopulse-growth-arrows.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={instrumentSans.variable}>
      <body>{children}</body>
    </html>
  );
}
