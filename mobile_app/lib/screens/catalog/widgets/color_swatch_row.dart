import 'package:flutter/material.dart';
import '../../../theme.dart';

class ColorSwatchRow extends StatelessWidget {
  final List<String> colors;
  final int selectedIndex;
  final ValueChanged<int> onSelect;
  final double dotSize;

  const ColorSwatchRow({
    super.key,
    required this.colors,
    required this.selectedIndex,
    required this.onSelect,
    this.dotSize = 16,
  });

  Color _parseColor(String colorStr) {
    String clean = colorStr.trim().replaceAll('#', '');
    if (clean.length == 6) {
      clean = 'FF$clean';
    }
    final val = int.tryParse(clean, radix: 16);
    if (val != null) return Color(val);

    switch (colorStr.toLowerCase()) {
      case 'black':
        return Colors.black;
      case 'gold':
        return const Color(0xFFD4AF37);
      case 'silver':
        return const Color(0xFFC0C0C0);
      case 'brown':
      case 'tortoise':
        return const Color(0xFF78350F);
      case 'amber':
      case 'orange':
        return AppColors.primary;
      case 'blue':
        return const Color(0xFF2563EB);
      default:
        return AppColors.slate700;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (colors.isEmpty) return const SizedBox.shrink();

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(colors.length, (index) {
        final color = _parseColor(colors[index]);
        final isSelected = selectedIndex == index;

        return GestureDetector(
          onTap: () => onSelect(index),
          behavior: HitTestBehavior.opaque,
          child: Container(
            margin: const EdgeInsets.only(right: 6),
            padding: const EdgeInsets.all(2),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: isSelected ? AppColors.primary : Colors.transparent,
                width: 1.5,
              ),
            ),
            child: Container(
              width: dotSize,
              height: dotSize,
              decoration: BoxDecoration(
                color: color,
                shape: BoxShape.circle,
                border: Border.all(color: AppColors.slate200, width: 0.5),
              ),
            ),
          ),
        );
      }),
    );
  }
}
