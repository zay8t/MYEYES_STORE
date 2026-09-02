"use client";

import React from "react";
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
  onSubmit?: (details: any, totalPrice: number) => void;
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
  const resolvedProductId = productId || frame?.id || "frame-item";

  return (
    <LensConfiguratorModal
      isOpen={isOpen}
      onClose={onClose}
      frame={{
        id: resolvedProductId,
        name: resolvedFrameName,
        price: resolvedFramePrice,
        imageUrl: frame?.imageUrl || "/placeholder-frame.png",
      }}
      currentUser={currentUser}
      onAddToCart={(config) => {
        if (onSubmit) {
          onSubmit(config.prescriptionDetails, config.totalPrice);
        }
        if (onAddToCart) {
          onAddToCart(config);
        }
      }}
    />
  );
}

export { LensConfiguratorModal };
export default ProductConfigurator;
