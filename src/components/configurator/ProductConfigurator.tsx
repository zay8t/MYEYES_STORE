"use client";

import React from "react";
import PrescriptionModal, { PrescriptionDetails } from "@/components/PrescriptionModal";
import LensConfiguratorModal, {
  LensConfiguratorModalProps,
  FrameDetails,
} from "./LensConfiguratorModal";

export interface ProductConfiguratorProps {
  isOpen: boolean;
  onClose: () => void;
  productName?: string;
  productPrice?: number;
  productId?: string;
  frame?: FrameDetails;
  onSubmit?: (details: PrescriptionDetails, totalPrice: number) => void;
  onAddToCart?: (config: any) => void;
  currentUser?: any;
}

export function ProductConfigurator({
  isOpen,
  onClose,
  productName,
  productPrice,
  productId,
  frame,
  onSubmit,
  onAddToCart,
  currentUser,
}: ProductConfiguratorProps) {
  const resolvedFrameName = productName || frame?.name || "Eyewear Frame";
  const resolvedFramePrice = productPrice ?? frame?.price ?? 0;
  const resolvedProductId = productId || frame?.id;

  const handleModalSubmit = (details: PrescriptionDetails, totalPrice: number) => {
    if (onSubmit) {
      onSubmit(details, totalPrice);
    }
    if (onAddToCart) {
      onAddToCart({
        productId: resolvedProductId,
        productName: resolvedFrameName,
        totalPrice,
        prescription: details,
      });
    }
  };

  return (
    <PrescriptionModal
      isOpen={isOpen}
      onClose={onClose}
      productName={resolvedFrameName}
      productPrice={resolvedFramePrice}
      productId={resolvedProductId}
      onSubmit={handleModalSubmit}
      currentUser={currentUser}
    />
  );
}

export { LensConfiguratorModal };
export default ProductConfigurator;
