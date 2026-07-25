"use client";

import Persistent3DViewer from "./Persistent3DViewer";

/**
 * Hero3DViewer points directly to the unified Persistent3DViewer component
 * to guarantee a single WebGL Canvas context across the application.
 */
export default Persistent3DViewer;