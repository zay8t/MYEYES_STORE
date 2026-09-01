"use client";

import React from "react";
import ProductConfigurator, { ProductConfiguratorProps } from "./ProductConfigurator";
import PrescriptionModal from "@/components/PrescriptionModal";

export function LensSelectionModal(props: ProductConfiguratorProps) {
  return <ProductConfigurator {...props} />;
}

export { PrescriptionModal, ProductConfigurator };
export default LensSelectionModal;
