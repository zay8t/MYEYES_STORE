import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../theme.dart';
import '../../../providers/configurator_provider.dart';
import '../../../widgets/common/brand_button.dart';

class StepChooseLenses extends StatelessWidget {
  final VoidCallback onNext;
  final VoidCallback onBack;

  const StepChooseLenses({
    super.key,
    required this.onNext,
    required this.onBack,
  });

  @override
  Widget build(BuildContext context) {
    final config = context.watch<ConfiguratorProvider>();
    final isPresbyopia = config.isPresbyopia;
    final lensPackages = config.availableLensPackages;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Header
        Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: const BoxDecoration(
                color: AppColors.primarySubtle,
                shape: BoxShape.circle,
              ),
              child: const Icon(LucideIcons.glasses, color: AppColors.primary, size: 18),
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Step 2 of 3: Lens Packages',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: AppColors.primary,
                  ),
                ),
                Text(
                  isPresbyopia ? 'Select Progressive / Multifocal' : 'Select Single Vision Optics',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: AppColors.slate900,
                  ),
                ),
              ],
            ),
          ],
        ),
        const SizedBox(height: 12),

        // Clinical Routing Notice
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppColors.slate50,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.slate200),
          ),
          child: Row(
            children: [
              Icon(
                isPresbyopia ? LucideIcons.layers : LucideIcons.sparkles,
                size: 16,
                color: AppColors.primary,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  isPresbyopia
                      ? 'Showing multi-focal progressive lenses tailored for age ${config.customerAge ?? 40}+'
                      : 'Showing precision single-vision lenses for distance or reading clarity',
                  style: const TextStyle(fontSize: 11, color: AppColors.slate600, fontWeight: FontWeight.w500),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // List of Lens Packages
        ...lensPackages.map((lens) {
          final isSelected = config.selectedLensPackageId == lens.id;
          final priceStr = lens.formattedPrice(isPresbyopia);

          return GestureDetector(
            onTap: () => config.selectLensPackage(lens.id),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isSelected ? AppColors.primarySubtle : Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isSelected ? AppColors.primary : AppColors.slate200,
                  width: isSelected ? 2 : 1,
                ),
                boxShadow: [
                  BoxShadow(
                    color: isSelected ? AppColors.primary.withOpacity(0.08) : Colors.black.withOpacity(0.02),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title & Price Row
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Selection Indicator
                      Container(
                        width: 20,
                        height: 20,
                        margin: const EdgeInsets.only(top: 2, right: 10),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: isSelected ? AppColors.primary : Colors.transparent,
                          border: Border.all(
                            color: isSelected ? AppColors.primary : AppColors.slate300,
                            width: 1.5,
                          ),
                        ),
                        child: isSelected
                            ? const Icon(LucideIcons.check, size: 12, color: Colors.white)
                            : null,
                      ),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    lens.title,
                                    style: TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w800,
                                      color: isSelected ? AppColors.primaryDark : AppColors.slate900,
                                    ),
                                  ),
                                ),
                                if (lens.isPopular)
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: AppColors.primary,
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: const Text(
                                      'POPULAR',
                                      style: TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.bold),
                                    ),
                                  ),
                              ],
                            ),
                            const SizedBox(height: 2),
                            Text(
                              lens.subtitle,
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: AppColors.slate500,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        priceStr,
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w900,
                          color: isSelected ? AppColors.primaryDark : AppColors.slate900,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),

                  // Description
                  Padding(
                    padding: const EdgeInsets.only(left: 30),
                    child: Text(
                      lens.description,
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.slate600,
                        height: 1.35,
                      ),
                    ),
                  ),

                  // Coating Spec Tag
                  Padding(
                    padding: const EdgeInsets.only(left: 30, top: 6),
                    child: Row(
                      children: [
                        const Icon(LucideIcons.shield, size: 12, color: AppColors.slate400),
                        const SizedBox(width: 4),
                        Text(
                          '${lens.coating} • Index ${lens.index}',
                          style: const TextStyle(fontSize: 10, color: AppColors.slate400, fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          );
        }),
        const SizedBox(height: 16),

        // Navigation Buttons
        Row(
          children: [
            Expanded(
              flex: 1,
              child: BrandButton(
                label: 'Back',
                variant: BrandButtonVariant.outline,
                onPressed: onBack,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              flex: 2,
              child: BrandButton(
                label: 'Prescription Review',
                icon: LucideIcons.arrowRight,
                onPressed: onNext,
              ),
            ),
          ],
        ),
      ],
    );
  }
}
