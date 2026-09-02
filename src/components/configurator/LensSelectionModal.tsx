"use client";

import React from "react";
import ProductConfigurator, { ProductConfiguratorProps } from "./ProductConfigurator";
import LensConfiguratorModal from "./LensConfiguratorModal";

export function LensSelectionModal(props: ProductConfiguratorProps) {
  return <ProductConfigurator {...props} />;
}

export { LensConfiguratorModal, ProductConfigurator };
export default LensSelectionModal;
