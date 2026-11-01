import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../theme.dart';
import '../../providers/wishlist_provider.dart';
import '../../providers/configurator_provider.dart';
import '../../providers/cart_provider.dart';
import '../product_detail/product_detail_screen.dart';
import '../configurator/lens_configurator_modal.dart';

class WishlistScreen extends StatelessWidget {
  const WishlistScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final wishlist = context.watch<WishlistProvider>();
    final items = wishlist.items;

    return Scaffold(
      backgroundColor: AppColors.slate50,
      appBar: AppBar(
        title: Text('Saved Frames (${items.length})'),
        actions: [
          if (items.isNotEmpty)
            TextButton(
              onPressed: wishlist.clearWishlist,
              child: const Text('Clear All', style: TextStyle(color: AppColors.slate500, fontSize: 12)),
            ),
        ],
      ),
      body: items.isEmpty
          ? Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      width: 80,
                      height: 80,
                      decoration: const BoxDecoration(
                        color: AppColors.slate100,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(LucideIcons.heart, size: 36, color: AppColors.slate400),
                    ),
                    const SizedBox(height: 20),
                    const Text(
                      'Your Wishlist is Empty',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppColors.slate900),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Tap the heart icon on any frame in our catalog to save it for later comparison.',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 13, color: AppColors.slate500, height: 1.4),
                    ),
                  ],
                ),
              ),
            )
          : ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: items.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final product = items[index];

                return Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.slate200),
                  ),
                  child: Row(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: CachedNetworkImage(
                          imageUrl: product.firstImage,
                          width: 80,
                          height: 80,
                          fit: BoxFit.cover,
                          errorWidget: (_, __, ___) => Container(width: 80, height: 80, color: AppColors.slate100),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              product.name,
                              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: AppColors.slate900),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '${product.formattedShape} • ${product.formattedMaterial}',
                              style: const TextStyle(fontSize: 11, color: AppColors.slate500),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              product.formattedPrice,
                              style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13, color: AppColors.primary),
                            ),
                            const SizedBox(height: 10),
                            Row(
                              children: [
                                ElevatedButton(
                                  style: ElevatedButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                    backgroundColor: AppColors.primary,
                                    foregroundColor: Colors.white,
                                  ),
                                  onPressed: () {
                                    context.read<ConfiguratorProvider>().startConfiguration(product);
                                    LensConfiguratorModal.show(context);
                                  },
                                  child: const Text('Add Lenses', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                                ),
                                const SizedBox(width: 8),
                                OutlinedButton(
                                  style: OutlinedButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                    side: const BorderSide(color: AppColors.slate300),
                                  ),
                                  onPressed: () {
                                    context.read<CartProvider>().addItem(product: product);
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text('${product.name} added to bag!'),
                                        backgroundColor: AppColors.slate900,
                                        duration: const Duration(seconds: 2),
                                      ),
                                    );
                                  },
                                  child: const Text('Frame Only', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.slate800)),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(LucideIcons.trash2, size: 18, color: AppColors.slate400),
                        onPressed: () => wishlist.removeFromWishlist(product.id),
                      ),
                    ],
                  ),
                );
              },
            ),
    );
  }
}
