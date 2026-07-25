"use client";

import dynamic from "next/dynamic";

const Persistent3DViewer = dynamic(() => import("./Persistent3DViewer"), {
  ssr: false,
});

/**
 * Frame3DCanvasWrapper dynamically loads the single unified Persistent3DViewer.
 */
export default function Frame3DCanvasWrapper() {
  return <Persistent3DViewer />;
}