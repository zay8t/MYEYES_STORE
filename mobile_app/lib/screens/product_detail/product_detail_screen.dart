import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../theme.dart';
import '../../models/product.dart';
import '../../providers/catalog_provider.dart';
import '../../providers/configurator_provider.dart';
import '../../widgets/common/price_tag.dart';
import '../../widgets/common/brand_button.dart';
import '../catalog/widgets/color_swatch_row.dart';
import 'widgets/frame_gallery.dart';
import 'widgets/spec_badge_row.dart';
import '../configurator/lens_configurator_modal.dart';

class ProductDetailScreen extends StatefulWidget {
  final Product product;

  const ProductDetailScreen({
    super.key,
    required this.product,
  });

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  int _selectedColorIndex = 0;

  @override
  Widget build(BuildContext context) {
    final product = widget.product;

    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft, color: AppColors.slate900),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.share2, color: AppColors.slate700),
            onPressed: () {},
          ),
          IconButton(
            icon: const Icon(LucideIcons.heart, color: AppColors.slate700),
            onPressed: () {},
          ),
        ],
      ),
      body: Column(
        children: [
          // Scrollable Body
          Expanded(
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // 1. Frame Image Gallery
                  FrameGallery(
                    images: product.images,
                    initialIndex: _selectedColorIndex,
                  ),

                  Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Category & Stock Status Row
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: AppColors.primarySubtle,
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                product.category.toUpperCase(),
                                style: const TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                  color: AppColors.primaryDark,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ),
                            Row(
                              children: [
                                Container(
                                  width: 6,
                                  height: 6,
                                  decoration: const BoxDecoration(
                                    color: AppColors.success,
                                    shape: BoxShape.circle,
                                  ),
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  product.stock > 0 ? 'In Stock (${product.stock} left)' : 'Backorder Available',
                                  style: const TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                    color: AppColors.slate600,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),

                        // Title
                        Text(
                          product.name,
                          style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w900,
                            color: AppColors.slate900,
                            letterSpacing: -0.5,
                          ),
                        ),
                        const SizedBox(height: 8),

                        // Price
                        PriceTag(price: product.price, fontSize: 20),
                        const SizedBox(height: 16),

                        // Color Selection Swatches
                        if (product.colors.isNotEmpty) ...[
                          const Text(
                            'Available Colorways',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: AppColors.slate500,
                            ),
                          ),
                          const SizedBox(height: 8),
                          ColorSwatchRow(
                            colors: product.colors,
                            selectedIndex: _selectedColorIndex,
                            onSelect: (index) {
                              setState(() => _selectedColorIndex = index);
                              context.read<CatalogProvider>().setProductSwatch(product.id, index);
                            },
                            dotSize: 22,
                          ),
                          const SizedBox(height: 20),
                        ],

                        // Technical Specs Badges
                        const Text(
                          'Optical Specifications',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: AppColors.slate500,
                          ),
                        ),
                        const SizedBox(height: 8),
                        SpecBadgeRow(product: product),
                        const SizedBox(height: 24),

                        // Description
                        const Text(
                          'Product Overview',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w800,
                            color: AppColors.slate900,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          product.description,
                          style: const TextStyle(
                            fontSize: 13,
                            color: AppColors.slate600,
                            height: 1.5,
                          ),
                        ),
                        const SizedBox(height: 24),

                        // Lens Included Promise Box
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: AppColors.slate50,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: AppColors.slate200),
                          ),
                          child: const Row(
                            children: [
                              Icon(LucideIcons.checkCircle2, color: AppColors.success, size: 20),
                              SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Standard Clear Lenses Included',
                                      style: TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.bold,
                                        color: AppColors.slate900,
                                      ),
                                    ),
                                    Text(
                                      'Free anti-reflective & UV400 coating included. Upgrade to Blue Shield or Transitions in the configurator.',
                                      style: TextStyle(
                                        fontSize: 11,
                                        color: AppColors.slate500,
                                        height: 1.3,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 32),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // 2. Sticky Bottom Surface
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              border: const Border(top: BorderSide(color: AppColors.slate200)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.04),
                  blurRadius: 10,
                  offset: const Offset(0, -4),
                ),
              ],
            ),
            child: SafeArea(
              child: Row(
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text(
                        'Total Frame Price',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: AppColors.slate400,
                        ),
                      ),
                      PriceTag(price: product.price, fontSize: 18),
                    ],
                  ),
                  const SizedBox(width: 20),
                  Expanded(
                    child: BrandButton(
                      label: 'Configure Lenses',
                      icon: LucideIcons.glasses,
                      onPressed: () {
                        final defaultColor = product.colors.isNotEmpty
                            ? product.colors[_selectedColorIndex]
                            : null;
                        context.read<ConfiguratorProvider>().startConfiguration(
                              product,
                              defaultColor: defaultColor,
                            );
                        LensConfiguratorModal.show(context);
                      },
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
