import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../theme.dart';
import '../../../models/cart_item.dart';
import '../../../widgets/common/price_tag.dart';

class CartItemTile extends StatefulWidget {
  final CartItem item;
  final ValueChanged<int> onQuantityChanged;
  final VoidCallback onRemove;

  const CartItemTile({
    super.key,
    required this.item,
    required this.onQuantityChanged,
    required this.onRemove,
  });

  @override
  State<CartItemTile> createState() => _CartItemTileState();
}

class _CartItemTileState extends State<CartItemTile> {
  bool _isExpanded = false;

  @override
  Widget build(BuildContext context) {
    final item = widget.item;
    final rx = item.prescription;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.slate200),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Thumbnail
                Container(
                  width: 76,
                  height: 76,
                  decoration: BoxDecoration(
                    color: AppColors.slate50,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.slate200, width: 0.5),
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: CachedNetworkImage(
                    imageUrl: item.image,
                    fit: BoxFit.cover,
                    placeholder: (_, __) => const Center(
                      child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
                    ),
                    errorWidget: (_, __, ___) => const Center(
                      child: Icon(LucideIcons.glasses, color: AppColors.slate300, size: 28),
                    ),
                  ),
                ),
                const SizedBox(width: 12),

                // Details
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item.name,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w800,
                          color: AppColors.slate900,
                        ),
                      ),
                      if (item.selectedColor != null)
                        Text(
                          'Color: ${item.selectedColor}',
                          style: const TextStyle(fontSize: 11, color: AppColors.slate500),
                        ),
                      if (item.lensPackageName != null) ...[
                        const SizedBox(height: 2),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.primarySubtle,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            item.lensPackageName!,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: AppColors.primaryDark,
                            ),
                          ),
                        ),
                      ],
                      const SizedBox(height: 6),
                      PriceTag(price: item.totalLinePrice, fontSize: 14),
                    ],
                  ),
                ),

                // Quantity Controls
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    IconButton(
                      icon: const Icon(LucideIcons.trash2, size: 16, color: AppColors.error),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                      onPressed: widget.onRemove,
                    ),
                    const SizedBox(height: 12),
                    Container(
                      decoration: BoxDecoration(
                        color: AppColors.slate50,
                        borderRadius: BorderRadius.circular(999),
                        border: Border.all(color: AppColors.slate200),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          IconButton(
                            icon: const Icon(LucideIcons.minus, size: 12),
                            padding: const EdgeInsets.all(4),
                            constraints: const BoxConstraints(),
                            onPressed: () => widget.onQuantityChanged(item.quantity - 1),
                          ),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 6),
                            child: Text(
                              '${item.quantity}',
                              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                            ),
                          ),
                          IconButton(
                            icon: const Icon(LucideIcons.plus, size: 12, color: AppColors.primary),
                            padding: const EdgeInsets.all(4),
                            constraints: const BoxConstraints(),
                            onPressed: () => widget.onQuantityChanged(item.quantity + 1),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Expandable Prescription Details Strip
          if (rx != null) ...[
            GestureDetector(
              onTap: () => setState(() => _isExpanded = !_isExpanded),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: const BoxDecoration(
                  color: AppColors.slate50,
                  border: Border(top: BorderSide(color: AppColors.slate100)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        const Icon(LucideIcons.fileText, size: 14, color: AppColors.primary),
                        const SizedBox(width: 6),
                        Text(
                          'Prescription: ${rx.lensTypeLabel}',
                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.slate700),
                        ),
                      ],
                    ),
                    Icon(
                      _isExpanded ? LucideIcons.chevronUp : LucideIcons.chevronDown,
                      size: 14,
                      color: AppColors.slate400,
                    ),
                  ],
                ),
              ),
            ),
            if (_isExpanded)
              Container(
                padding: const EdgeInsets.all(12),
                color: AppColors.slate50,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Right Eye (OD): SPH ${rx.odSph > 0 ? "+" : ""}${rx.odSph.toStringAsFixed(2)}${rx.odCyl != null ? " | CYL ${rx.odCyl!.toStringAsFixed(2)} AXIS ${rx.odAxis ?? 0}°" : ""}',
                      style: const TextStyle(fontSize: 11, color: AppColors.slate700),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Left Eye (OS): SPH ${rx.osSph > 0 ? "+" : ""}${rx.osSph.toStringAsFixed(2)}${rx.osCyl != null ? " | CYL ${rx.osCyl!.toStringAsFixed(2)} AXIS ${rx.osAxis ?? 0}°" : ""}',
                      style: const TextStyle(fontSize: 11, color: AppColors.slate700),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Pupillary Distance (PD): ${rx.pd} mm',
                      style: const TextStyle(fontSize: 11, color: AppColors.slate700),
                    ),
                    if (rx.addPower != null) ...[
                      const SizedBox(height: 2),
                      Text(
                        'Reading ADD Power: +${rx.addPower!.toStringAsFixed(2)} D',
                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.primaryDark),
                      ),
                    ],
                    if (rx.fileUrl != null) ...[
                      const SizedBox(height: 4),
                      const Row(
                        children: [
                          Icon(LucideIcons.checkCircle2, size: 12, color: AppColors.success),
                          SizedBox(width: 4),
                          Text('Doctor slip image attached', style: TextStyle(fontSize: 10, color: AppColors.success, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
          ],
        ],
      ),
    );
  }
}
