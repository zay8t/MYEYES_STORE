import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../theme.dart';

class LensPricingScreen extends StatelessWidget {
  const LensPricingScreen({super.key});

  final List<Map<String, dynamic>> _lensPackages = const [
    {
      'title': 'Standard Clear Single Vision',
      'price': 'Included (Rs. 0)',
      'index': '1.56 Standard',
      'idealFor': 'Low prescriptions (Up to -2.50 SPH)',
      'coatings': ['Anti-Reflective', 'Scratch Resistant', 'UV380 Protection'],
      'isPopular': false,
    },
    {
      'title': 'Blue Cut Screen Shield',
      'price': 'Rs. 850',
      'index': '1.56 Anti-Glare',
      'idealFor': 'Computer users, students, software engineers',
      'coatings': ['420nm Blue Light Block', 'Green Anti-Glare Reflex', 'Hydrophobic Easy-Clean', 'UV400 Certified'],
      'isPopular': true,
    },
    {
      'title': 'Photochromic Transitions',
      'price': 'Rs. 1,450',
      'index': '1.56 Fast-Reaction',
      'idealFor': 'Individuals wanting 2-in-1 indoor clear & outdoor sunglasses',
      'coatings': ['Fast UV Auto-Darkening', 'Anti-Reflective', 'UV400 Full Spectrum', 'Scratch Guard'],
      'isPopular': false,
    },
    {
      'title': 'Ultra-Thin High Index 1.67',
      'price': 'Rs. 2,500',
      'index': '1.67 High Index Slim',
      'idealFor': 'Strong prescriptions (-3.00 to -8.00 SPH)',
      'coatings': ['35% Thinner & Lighter', 'Aspheric Flat Surface', 'Super Hydrophobic', 'Dual Anti-Reflective'],
      'isPopular': false,
    },
    {
      'title': 'Digital Progressive (Multifocal)',
      'price': 'Rs. 3,500',
      'index': '1.56 Free-Form Corridor',
      'idealFor': 'Age 40+ needing distance, computer, and reading without lines',
      'coatings': ['Seamless Digital Progression', 'Wide Intermediate Corridor', 'Anti-Glare', 'UV400'],
      'isPopular': false,
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.slate50,
      appBar: AppBar(
        title: const Text('Optical Lens Pricing & Guide'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Header Banner
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.slate200),
            ),
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '100% TRANSPARENT OPTICAL PRICING',
                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppColors.primary, letterSpacing: 1),
                ),
                SizedBox(height: 6),
                Text(
                  'Prescription Lens Packages in Pakistan',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppColors.slate900),
                ),
                SizedBox(height: 6),
                Text(
                  'Unlike physical retail optical shops with high markups, MY EYES glazes lenses directly in our lab with computerized digital lensometers at direct factory pricing.',
                  style: TextStyle(fontSize: 12, color: AppColors.slate600, height: 1.4),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Packages List
          ..._lensPackages.map((pkg) {
            final isPop = pkg['isPopular'] as bool;
            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isPop ? AppColors.primarySubtle : Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isPop ? AppColors.primary : AppColors.slate200,
                  width: isPop ? 1.5 : 1,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          pkg['title'] as String,
                          style: TextStyle(
                            fontWeight: FontWeight.w800,
                            fontSize: 14,
                            color: isPop ? AppColors.primaryDark : AppColors.slate900,
                          ),
                        ),
                      ),
                      Text(
                        pkg['price'] as String,
                        style: TextStyle(
                          fontWeight: FontWeight.w900,
                          fontSize: 14,
                          color: isPop ? AppColors.primaryDark : AppColors.primary,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text('Index: ${pkg['index']} • Ideal for: ${pkg['idealFor']}', style: const TextStyle(fontSize: 11, color: AppColors.slate600)),
                  const Divider(height: 20, color: AppColors.slate100),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: (pkg['coatings'] as List<String>)
                        .map(
                          (c) => Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: isPop ? Colors.white : AppColors.slate100,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(LucideIcons.check, size: 10, color: AppColors.success),
                                const SizedBox(width: 4),
                                Text(c, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: AppColors.slate700)),
                              ],
                            ),
                          ),
                        )
                        .toList(),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}
