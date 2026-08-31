import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../theme.dart';
import '../../../models/product.dart';
import '../../../providers/catalog_provider.dart';
import '../../../widgets/common/price_tag.dart';
import 'color_swatch_row.dart';

class ProductCard extends StatelessWidget {
  final Product product;
  final VoidCallback onTap;
  final VoidCallback onConfigure;

  const ProductCard({
    super.key,
    required this.product,
    required this.onTap,
    required this.onConfigure,
  });

  @override
  Widget build(BuildContext context) {
    final catalog = context.watch<CatalogProvider>();
    final activeSwatchIndex = catalog.getActiveSwatchIndex(product.id);

    // Get active display image based on active swatch index
    String currentImage = product.firstImage;
    if (product.images.length > activeSwatchIndex) {
      currentImage = product.images[activeSwatchIndex];
    }

    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.slate200),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.02),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Frame Image Container with Swatch Overlay
            Expanded(
              child: Stack(
                children: [
                  Container(
                    width: double.infinity,
                    color: AppColors.slate50,
                    child: CachedNetworkImage(
                      imageUrl: currentImage,
                      fit: BoxFit.cover,
                      placeholder: (_, __) => const Center(
                        child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
                      ),
                      errorWidget: (_, __, ___) => const Center(
                        child: Icon(LucideIcons.glasses, color: AppColors.slate300, size: 36),
                      ),
                    ),
                  ),

                  // Category/Shape Badge
                  Positioned(
                    top: 8,
                    left: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.92),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: AppColors.slate200, width: 0.5),
                      ),
                      child: Text(
                        product.formattedShape.toUpperCase(),
                        style: const TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.w800,
                          color: AppColors.slate700,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ),

                  // Material Badge
                  if (product.material != 'NILL')
                    Positioned(
                      top: 8,
                      right: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppColors.slate900.withOpacity(0.85),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          product.formattedMaterial,
                          style: const TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),

            // Card Body
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Reactive Color Swatches
                  if (product.colors.isNotEmpty) ...[
                    ColorSwatchRow(
                      colors: product.colors,
                      selectedIndex: activeSwatchIndex,
                      onSelect: (index) {
                        catalog.setProductSwatch(product.id, index);
                      },
                      dotSize: 14,
                    ),
                    const SizedBox(height: 8),
                  ],

                  // Product Title
                  Text(
                    product.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w800,
                      color: AppColors.slate900,
                    ),
                  ),
                  const SizedBox(height: 4),

                  // Price & CTA Button
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      PriceTag(price: product.price, fontSize: 13),
                      GestureDetector(
                        onTap: onConfigure,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(
                            color: AppColors.slate900,
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(LucideIcons.glasses, size: 12, color: Colors.white),
                              SizedBox(width: 4),
                              Text(
                                'Add Lenses',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
