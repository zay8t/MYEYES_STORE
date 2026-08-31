import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../theme.dart';
import '../../models/product.dart';
import '../../providers/catalog_provider.dart';
import '../../providers/configurator_provider.dart';
import '../../widgets/common/custom_app_bar.dart';
import 'widgets/product_card.dart';
import 'widgets/filter_sheet.dart';
import '../product_detail/product_detail_screen.dart';
import '../configurator/lens_configurator_modal.dart';

class CatalogScreen extends StatefulWidget {
  const CatalogScreen({super.key});

  @override
  State<CatalogScreen> createState() => _CatalogScreenState();
}

class _CatalogScreenState extends State<CatalogScreen> {
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CatalogProvider>().fetchProducts();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final catalog = context.watch<CatalogProvider>();
    final products = catalog.filteredProducts;

    return Scaffold(
      appBar: const CustomAppBar(),
      body: RefreshIndicator(
        onRefresh: () => catalog.fetchProducts(forceRefresh: true),
        color: AppColors.primary,
        child: CustomScrollView(
          slivers: [
            // Search & Category Bar (Pinned/Top)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    // Search Field + Filter Button Row
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _searchController,
                            onChanged: catalog.setSearchQuery,
                            decoration: InputDecoration(
                              hintText: 'Search frames, shapes, materials...',
                              prefixIcon: const Icon(LucideIcons.search, size: 18, color: AppColors.slate400),
                              suffixIcon: _searchController.text.isNotEmpty
                                  ? IconButton(
                                      icon: const Icon(LucideIcons.x, size: 16),
                                      onPressed: () {
                                        _searchController.clear();
                                        catalog.setSearchQuery('');
                                      },
                                    )
                                  : null,
                              contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 16),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        // Filter Sheet Launcher Button
                        GestureDetector(
                          onTap: () => FilterSheet.show(context),
                          child: Container(
                            height: 48,
                            padding: const EdgeInsets.symmetric(horizontal: 14),
                            decoration: BoxDecoration(
                              color: catalog.activeFilterCount > 0 ? AppColors.primarySubtle : AppColors.slate50,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: catalog.activeFilterCount > 0 ? AppColors.primary : AppColors.slate200,
                              ),
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  LucideIcons.slidersHorizontal,
                                  size: 18,
                                  color: catalog.activeFilterCount > 0 ? AppColors.primaryDark : AppColors.slate700,
                                ),
                                if (catalog.activeFilterCount > 0) ...[
                                  const SizedBox(width: 6),
                                  Container(
                                    padding: const EdgeInsets.all(4),
                                    decoration: const BoxDecoration(
                                      color: AppColors.primary,
                                      shape: BoxShape.circle,
                                    ),
                                    child: Text(
                                      '${catalog.activeFilterCount}',
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),

                    // Category Pill Selectors
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          _buildCategoryChip('All Frames', 'ALL', catalog),
                          const SizedBox(width: 8),
                          _buildCategoryChip('Eyeglasses', 'EYEGLASSES', catalog),
                          const SizedBox(width: 8),
                          _buildCategoryChip('Sunglasses', 'SUNGLASSES', catalog),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Product Count Strip
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      '${products.length} Products Found',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: AppColors.slate500,
                      ),
                    ),
                    if (catalog.activeFilterCount > 0)
                      GestureDetector(
                        onTap: catalog.resetFilters,
                        child: const Text(
                          'Clear Filters',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: AppColors.primary,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),

            // Loading State
            if (catalog.isLoading)
              const SliverFillRemaining(
                child: Center(
                  child: CircularProgressIndicator(color: AppColors.primary),
                ),
              )
            // Empty State
            else if (products.isEmpty)
              SliverFillRemaining(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(LucideIcons.glasses, size: 48, color: AppColors.slate300),
                      const SizedBox(height: 12),
                      const Text(
                        'No frames match your filters',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.slate800),
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'Try clearing search keywords or filter facets.',
                        style: TextStyle(fontSize: 12, color: AppColors.slate500),
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: catalog.resetFilters,
                        child: const Text('Reset All Filters'),
                      ),
                    ],
                  ),
                ),
              )
            // Products Grid
            else
              SliverPadding(
                padding: const EdgeInsets.all(16),
                sliver: SliverGrid(
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    childAspectRatio: 0.68,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                  ),
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final product = products[index];
                      return ProductCard(
                        product: product,
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => ProductDetailScreen(product: product),
                            ),
                          );
                        },
                        onConfigure: () {
                          context.read<ConfiguratorProvider>().startConfiguration(product);
                          LensConfiguratorModal.show(context);
                        },
                      );
                    },
                    childCount: products.length,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildCategoryChip(String label, String value, CatalogProvider catalog) {
    final isSelected = catalog.selectedCategory == value;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (_) => catalog.setCategory(value),
      selectedColor: AppColors.primary,
      backgroundColor: AppColors.slate50,
      labelStyle: TextStyle(
        fontSize: 12,
        fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
        color: isSelected ? Colors.white : AppColors.slate700,
      ),
      side: BorderSide(
        color: isSelected ? AppColors.primary : AppColors.slate200,
      ),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
    );
  }
}
