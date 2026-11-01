import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../theme.dart';
import '../../models/product.dart';
import '../../providers/catalog_provider.dart';
import '../../providers/configurator_provider.dart';
import '../../providers/wishlist_provider.dart';
import '../../providers/cart_provider.dart';
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
    final wishlist = context.watch<WishlistProvider>();
    final cart = context.watch<CartProvider>();
    final isFav = wishlist.isFavorite(product.id);

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft, color: AppColors.slate900),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: Icon(
              LucideIcons.heart,
              color: isFav ? AppColors.error : AppColors.slate700,
            ),
            onPressed: () {
              wishlist.toggleFavorite(product);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(isFav ? 'Removed from saved frames' : 'Saved to your wishlist!'),
                  duration: const Duration(seconds: 1),
                  backgroundColor: AppColors.slate900,
                ),
              );
            },
          ),
          IconButton(
            icon: Badge(
              isLabelVisible: cart.itemCount > 0,
              label: Text('${cart.itemCount}'),
              backgroundColor: AppColors.primary,
              child: const Icon(LucideIcons.shoppingBag, color: AppColors.slate700),
            ),
            onPressed: () => Navigator.pop(context),
          ),
          const SizedBox(width: 8),
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
                                  product.stock > 0 ? 'In Stock (${product.stock} available)' : 'Backorder Available',
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
                          'Frame Optical Specifications',
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
                          'Frame Overview & Material',
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
                                      'Free anti-reflective & UV400 coating included with every frame. Upgrade to Blue Shield or Transitions in the configurator.',
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
                        const SizedBox(height: 16),

                        // Delivery & Lab Guarantee Strip
                        Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: AppColors.slate200),
                          ),
                          child: const Column(
                            children: [
                              Row(
                                children: [
                                  Icon(LucideIcons.truck, size: 16, color: AppColors.primary),
                                  SizedBox(width: 8),
                                  Text('Flat Rs. 250 Delivery (FREE over Rs. 3,000)', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                                ],
                              ),
                              SizedBox(height: 8),
                              Row(
                                children: [
                                  Icon(LucideIcons.shieldCheck, size: 16, color: AppColors.success),
                                  SizedBox(width: 8),
                                  Text('100% Prescription Accuracy Guarantee', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                                ],
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

          // 2. Sticky Bottom Surface with Dual Actions
          Container(
            padding: const EdgeInsets.all(16),
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
                  // Frame Only Button
                  OutlinedButton(
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                      side: const BorderSide(color: AppColors.slate300),
                    ),
                    onPressed: () {
                      final selectedColor = product.colors.isNotEmpty
                          ? product.colors[_selectedColorIndex]
                          : null;
                      cart.addItem(
                        product: product,
                        selectedColor: selectedColor,
                      );
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('${product.name} (Frame Only) added to Bag!'),
                          backgroundColor: AppColors.slate900,
                          duration: const Duration(seconds: 2),
                        ),
                      );
                    },
                    child: const Text('Frame Only', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.slate800)),
                  ),
                  const SizedBox(width: 10),
                  // Configure Lenses (Primary Action)
                  Expanded(
                    child: BrandButton(
                      label: 'Select Lenses & Rx',
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
