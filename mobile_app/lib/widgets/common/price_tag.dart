import 'package:flutter/material.dart';
import '../../theme.dart';

class PriceTag extends StatelessWidget {
  final double price;
  final double fontSize;
  final FontWeight fontWeight;
  final Color? color;
  final String? prefix;
  final bool showCurrency;

  const PriceTag({
    super.key,
    required this.price,
    this.fontSize = 14,
    this.fontWeight = FontWeight.w900,
    this.color,
    this.prefix,
    this.showCurrency = true,
  });

  String get formattedPrice {
    final rounded = price.round();
    final formatted = rounded.toString().replaceAllMapped(
          RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
          (Match m) => '${m[1]},',
        );
    final cur = showCurrency ? 'Rs. ' : '';
    final pre = prefix != null ? '$prefix ' : '';
    return '$pre$cur$formatted';
  }

  @override
  Widget build(BuildContext context) {
    return Text(
      formattedPrice,
      style: TextStyle(
        fontSize: fontSize,
        fontWeight: fontWeight,
        color: color ?? AppColors.slate900,
        letterSpacing: -0.3,
      ),
    );
  }
}
