import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Style Quiz — Find Your Perfect Frames | MY EYES",
  description:
    "Take our 8-step personalized style quiz to discover frames that match your face shape, lifestyle, and aesthetic. Get curated recommendations with match scores.",
};

export default function QuizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The quiz has its own full-screen wizard layout
  // We simply pass children through — the root layout Header is suppressed by
  // the Header component itself which doesn't suppress /quiz routes.
  // We wrap in an isolation div to prevent the root layout footer from overlapping.
  return <div className="quiz-layout-root">{children}</div>;
}
