import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../theme.dart';
import '../../../providers/catalog_provider.dart';
import '../../../widgets/common/brand_button.dart';

class FilterSheet extends StatefulWidget {
  const FilterSheet({super.key});

  static void show(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const FilterSheet(),
    );
  }

  @override
  State<FilterSheet> createState() => _FilterSheetState();
}

class _FilterSheetState extends State<FilterSheet> {
  static const List<Map<String, String>> shapes = [
    {'key': 'ROUND', 'label': 'Round'},
    {'key': 'SQUARE', 'label': 'Square'},
    {'key': 'AVIATOR', 'label': 'Aviator'},
    {'key': 'RECTANGLE', 'label': 'Rectangle'},
    {'key': 'OVAL', 'label': 'Oval'},
    {'key': 'CAT_EYE', 'label': 'Cat-Eye'},
    {'key': 'GEOMETRIC', 'label': 'Geometric'},
  ];

  static const List<Map<String, String>> materials = [
    {'key': 'TITANIUM', 'label': 'Titanium'},
    {'key': 'ACETATE', 'label': 'Bio-Acetate'},
    {'key': 'TR90', 'label': 'TR-90 Flexible'},
    {'key': 'METAL', 'label': 'Premium Metal'},
    {'key': 'STAINLESS_STEEL', 'label': 'Stainless Steel'},
  ];

  static const List<Map<String, String>> genders = [
    {'key': 'MEN', 'label': 'Men'},
    {'key': 'WOMEN', 'label': 'Women'},
    {'key': 'UNISEX', 'label': 'Unisex'},
  ];

  @override
  Widget build(BuildContext context) {
    final catalog = context.watch<CatalogProvider>();
    final matchCount = catalog.filteredProducts.length;

    return Container(
      height: MediaQuery.of(context).size.height * 0.82,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          // Drag Handle
          Center(
            child: Container(
              margin: const EdgeInsets.only(top: 12, bottom: 8),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.slate200,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),

          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Filter Frames',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: AppColors.slate900,
                  ),
                ),
                TextButton(
                  onPressed: catalog.resetFilters,
                  child: const Text(
                    'Reset All',
                    style: TextStyle(
                      color: AppColors.primary,
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1, color: AppColors.slate100),

          // Filter Content
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(20),
              children: [
                // 1. Frame Shape
                _buildSectionHeader('Frame Shape', catalog.selectedShapes.length),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: shapes.map((shape) {
                    final isSelected = catalog.selectedShapes.contains(shape['key']);
                    return FilterChip(
                      label: Text(shape['label']!),
                      selected: isSelected,
                      onSelected: (_) => catalog.toggleShapeFilter(shape['key']!),
                      selectedColor: AppColors.primarySubtle,
                      labelStyle: TextStyle(
                        fontSize: 12,
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                        color: isSelected ? AppColors.primaryDark : AppColors.slate700,
                      ),
                      side: BorderSide(
                        color: isSelected ? AppColors.primary : AppColors.slate200,
                      ),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 24),

                // 2. Material
                _buildSectionHeader('Material', catalog.selectedMaterials.length),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: materials.map((mat) {
                    final isSelected = catalog.selectedMaterials.contains(mat['key']);
                    return FilterChip(
                      label: Text(mat['label']!),
                      selected: isSelected,
                      onSelected: (_) => catalog.toggleMaterialFilter(mat['key']!),
                      selectedColor: AppColors.primarySubtle,
                      labelStyle: TextStyle(
                        fontSize: 12,
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                        color: isSelected ? AppColors.primaryDark : AppColors.slate700,
                      ),
                      side: BorderSide(
                        color: isSelected ? AppColors.primary : AppColors.slate200,
                      ),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 24),

                // 3. Gender
                _buildSectionHeader('Gender', catalog.selectedGenders.length),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: genders.map((g) {
                    final isSelected = catalog.selectedGenders.contains(g['key']);
                    return FilterChip(
                      label: Text(g['label']!),
                      selected: isSelected,
                      onSelected: (_) => catalog.toggleGenderFilter(g['key']!),
                      selectedColor: AppColors.primarySubtle,
                      labelStyle: TextStyle(
                        fontSize: 12,
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                        color: isSelected ? AppColors.primaryDark : AppColors.slate700,
                      ),
                      side: BorderSide(
                        color: isSelected ? AppColors.primary : AppColors.slate200,
                      ),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 24),

                // 4. Price Range Slider
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Price Range (PKR)',
                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.slate900),
                    ),
                    Text(
                      'Rs. ${catalog.minPrice.round()} – Rs. ${catalog.maxPrice.round()}',
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primary),
                    ),
                  ],
                ),
                RangeSlider(
                  values: RangeValues(catalog.minPrice, catalog.maxPrice),
                  min: 0,
                  max: 25000,
                  divisions: 50,
                  activeColor: AppColors.primary,
                  inactiveColor: AppColors.slate200,
                  onChanged: (values) {
                    catalog.setPriceRange(values.start, values.end);
                  },
                ),
              ],
            ),
          ),

          // Bottom Apply Button
          Container(
            padding: const EdgeInsets.all(20),
            decoration: const BoxDecoration(
              color: Colors.white,
              border: Border(top: BorderSide(color: AppColors.slate100)),
            ),
            child: SafeArea(
              child: BrandButton(
                label: 'Show $matchCount Frames',
                onPressed: () => Navigator.pop(context),
                icon: LucideIcons.check,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title, int count) {
    return Row(
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            color: AppColors.slate900,
          ),
        ),
        if (count > 0) ...[
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
              color: AppColors.primary,
              borderRadius: BorderRadius.circular(999),
            ),
            child: Text(
              '$count',
              style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ],
    );
  }
}
