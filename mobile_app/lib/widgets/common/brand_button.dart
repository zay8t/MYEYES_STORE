import 'package:flutter/material.dart';
import '../../theme.dart';

enum BrandButtonVariant {
  primary,   // #ff7a00 brand orange
  secondary, // #0f172a slate 900
  outline,   // border border-slate-900
  subtle,    // light slate 100
}

class BrandButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final BrandButtonVariant variant;
  final bool isLoading;
  final double height;
  final double? width;
  final double fontSize;

  const BrandButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.icon,
    this.variant = BrandButtonVariant.primary,
    this.isLoading = false,
    this.height = 48,
    this.width,
    this.fontSize = 14,
  });

  @override
  Widget build(BuildContext context) {
    Color bgColor;
    Color fgColor;
    BorderSide borderSide = BorderSide.none;

    switch (variant) {
      case BrandButtonVariant.primary:
        bgColor = AppColors.primary;
        fgColor = Colors.white;
        break;
      case BrandButtonVariant.secondary:
        bgColor = AppColors.slate900;
        fgColor = Colors.white;
        break;
      case BrandButtonVariant.outline:
        bgColor = Colors.white;
        fgColor = AppColors.slate900;
        borderSide = const BorderSide(color: AppColors.slate900, width: 1.5);
        break;
      case BrandButtonVariant.subtle:
        bgColor = AppColors.slate100;
        fgColor = AppColors.slate800;
        borderSide = const BorderSide(color: AppColors.slate200, width: 1);
        break;
    }

    return SizedBox(
      height: height,
      width: width ?? double.infinity,
      child: ElevatedButton(
        onPressed: isLoading ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: bgColor,
          foregroundColor: fgColor,
          disabledBackgroundColor: bgColor.withOpacity(0.6),
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 20),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(9999),
            side: borderSide,
          ),
        ),
        child: isLoading
            ? SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2.2,
                  color: fgColor,
                ),
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (icon != null) ...[
                    Icon(icon, size: fontSize + 2, color: fgColor),
                    const SizedBox(width: 8),
                  ],
                  Text(
                    label,
                    style: TextStyle(
                      fontSize: fontSize,
                      fontWeight: FontWeight.w700,
                      color: fgColor,
                      letterSpacing: -0.2,
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}
