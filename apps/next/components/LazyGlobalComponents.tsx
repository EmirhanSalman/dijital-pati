"use client";

import dynamic from "next/dynamic";

const Toaster = dynamic(
  () => import("sonner").then((mod) => ({ default: mod.Toaster })),
  { ssr: false }
);

const SpeedInsights = dynamic(
  () =>
    import("@vercel/speed-insights/next").then((mod) => ({ default: mod.SpeedInsights })),
  { ssr: false }
);

const Analytics = dynamic(
  () => import("@vercel/analytics/react").then((mod) => ({ default: mod.Analytics })),
  { ssr: false }
);

export default function LazyGlobalComponents() {
  return (
    <>
      <Toaster position="top-center" richColors />
      <SpeedInsights />
      <Analytics />
    </>
  );
}
