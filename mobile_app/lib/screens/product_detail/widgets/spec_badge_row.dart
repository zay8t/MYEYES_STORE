import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../theme.dart';
import '../../../models/product.dart';

class SpecBadgeRow extends StatelessWidget {
  final Product product;

  const SpecBadgeRow({
    super.key,
    required this.product,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          _buildSpecBadge(
            icon: LucideIcons.ruler,
            label: 'Size',
            value: '51-19-145 mm',
          ),
          const SizedBox(width: 8),
          _buildSpecBadge(
            icon: LucideIcons.shapes,
            label: 'Shape',
            value: product.formattedShape,
          ),
          const SizedBox(width: 8),
          _buildSpecBadge(
            icon: LucideIcons.shieldCheck,
            label: 'Material',
            value: product.formattedMaterial,
          ),
          const SizedBox(width: 8),
          _buildSpecBadge(
            icon: LucideIcons.user,
            label: 'Gender',
            value: product.gender,
          ),
        ],
      ),
    );
  }

  Widget _buildSpecBadge({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: AppColors.slate50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.slate200),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: AppColors.slate500),
          const SizedBox(width: 6),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                label.toUpperCase(),
                style: const TextStyle(
                  fontSize: 9,
                  fontWeight: FontWeight.bold,
                  color: AppColors.slate400,
                  letterSpacing: 0.5,
                ),
              ),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: AppColors.slate800,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
