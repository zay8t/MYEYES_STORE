import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../theme.dart';

class LensSimulatorScreen extends StatefulWidget {
  const LensSimulatorScreen({super.key});

  @override
  State<LensSimulatorScreen> createState() => _LensSimulatorScreenState();
}

class _LensSimulatorScreenState extends State<LensSimulatorScreen> {
  // 0: Digital Screen, 1: Outdoor Sunlight, 2: Night Driving
  int _selectedEnvironment = 0;

  // 0: Clear, 1: Blue Cut, 2: Photochromic, 3: Polarized
  int _selectedLens = 1;

  // Slider for Photochromic activation (0.0 to 1.0)
  double _sunlightIntensity = 0.75;

  // Split-screen / comparison toggle
  bool _showComparison = false;

  final List<Map<String, dynamic>> _environments = [
    {
      'name': 'Digital Screen',
      'icon': LucideIcons.laptop,
      'sceneryUrl': 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
      'description': 'Simulating LED monitor glare, blue wavelengths, and office light reflections.',
    },
    {
      'name': 'Bright Sunlight',
      'icon': LucideIcons.sun,
      'sceneryUrl': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
      'description': 'Simulating intense UV rays and blinding daytime glare.',
    },
    {
      'name': 'Night Driving',
      'icon': LucideIcons.car,
      'sceneryUrl': 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&auto=format&fit=crop&q=80',
      'description': 'Simulating oncoming headlight halo spikes and wet pavement reflections.',
    },
  ];

  final List<Map<String, dynamic>> _lenses = [
    {
      'name': 'Standard Clear',
      'subtitle': 'Index 1.56 Basic',
      'price': 'Included (Rs. 0)',
      'uv': 'UV380',
      'blueCut': '15%',
      'glare': 'Standard',
      'color': Colors.transparent,
      'badge': 'Standard',
      'description': 'Everyday prescription lenses with basic scratch-resistant coating.',
    },
    {
      'name': 'Blue Cut Shield',
      'subtitle': 'Digital Protection',
      'price': '+Rs. 850',
      'uv': 'UV400',
      'blueCut': '95%',
      'glare': 'Anti-Reflective',
      'color': Color(0x33FFB300), // Amber warm filter
      'badge': 'Most Popular',
      'description': 'Blocks 420nm high-energy visible blue light to relieve eye strain and headaches.',
    },
    {
      'name': 'Photochromic Transitions',
      'subtitle': 'Clear to Dark Auto-Tint',
      'price': '+Rs. 1,450',
      'uv': '100% UV400',
      'blueCut': '85%',
      'glare': 'Adaptive Tint',
      'color': Color(0x992B1810), // Charcoal tint
      'badge': '2-in-1',
      'description': 'Crystal clear indoors; reacts dynamically to sunlight UV to become deep sunglasses.',
    },
    {
      'name': 'DriveSafe Polarized',
      'subtitle': 'Zero-Glare Optics',
      'price': '+Rs. 1,650',
      'uv': '100% UV400',
      'blueCut': '90%',
      'glare': '99% Glare Eliminated',
      'color': Color(0x88000000), // Polarized dark tint
      'badge': 'Driving Safe',
      'description': 'Precision vertical polarizing filters that eliminate road and water surface glare.',
    },
  ];

  @override
  Widget build(BuildContext context) {
    final env = _environments[_selectedEnvironment];
    final lens = _lenses[_selectedLens];

    return Scaffold(
      backgroundColor: AppColors.slate50,
      appBar: AppBar(
        title: const Text('Optical Lens Simulator'),
        actions: [
          IconButton(
            icon: Icon(
              _showComparison ? LucideIcons.split : LucideIcons.columns,
              color: _showComparison ? AppColors.primary : AppColors.slate600,
            ),
            tooltip: 'Toggle Split View',
            onPressed: () => setState(() => _showComparison = !_showComparison),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Subtitle
            const Text(
              'EXPERIENCE REAL OPTICAL COATINGS',
              style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppColors.primary, letterSpacing: 1),
            ),
            const SizedBox(height: 4),
            const Text(
              'Interactive Vision Coating Simulator',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: AppColors.slate900),
            ),
            const SizedBox(height: 6),
            const Text(
              'Select an environment and see how our lab coatings filter harmful rays, reflections, and glare in real time.',
              style: TextStyle(fontSize: 12, color: AppColors.slate600),
            ),
            const SizedBox(height: 16),

            // 1. Environment Pills
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: List.generate(_environments.length, (index) {
                  final e = _environments[index];
                  final isSelected = _selectedEnvironment == index;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      avatar: Icon(e['icon'] as IconData, size: 16, color: isSelected ? Colors.white : AppColors.slate600),
                      label: Text(e['name'] as String),
                      selected: isSelected,
                      selectedColor: AppColors.slate900,
                      backgroundColor: Colors.white,
                      labelStyle: TextStyle(
                        fontSize: 12,
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                        color: isSelected ? Colors.white : AppColors.slate700,
                      ),
                      side: BorderSide(color: isSelected ? AppColors.slate900 : AppColors.slate200),
                      onSelected: (val) {
                        if (val) setState(() => _selectedEnvironment = index);
                      },
                    ),
                  );
                }),
              ),
            ),
            const SizedBox(height: 16),

            // 2. Visual Viewport with Lens Simulation Effect
            Container(
              height: 240,
              width: double.infinity,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.08),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(20),
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    // Background Image
                    Image.network(
                      env['sceneryUrl'] as String,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Container(color: AppColors.slate800),
                    ),

                    // Simulation Filter Overlay
                    if (!_showComparison)
                      _buildLensOverlay(lens)
                    else
                      // Split Comparison View
                      Row(
                        children: [
                          Expanded(
                            child: Container(
                              alignment: Alignment.bottomLeft,
                              padding: const EdgeInsets.all(12),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: Colors.black.withOpacity(0.6),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: const Text(
                                  'Uncoated Eye',
                                  style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                                ),
                              ),
                            ),
                          ),
                          Container(width: 2, color: Colors.white),
                          Expanded(
                            child: Stack(
                              fit: StackFit.expand,
                              children: [
                                _buildLensOverlay(lens),
                                Container(
                                  alignment: Alignment.bottomRight,
                                  padding: const EdgeInsets.all(12),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: AppColors.primary.withOpacity(0.9),
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: Text(
                                      lens['name'] as String,
                                      style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),

                    // Eyeglass Frame Watermark Overlay
                    Center(
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.4),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: Colors.white.withOpacity(0.3)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(LucideIcons.glasses, size: 16, color: Colors.white),
                            const SizedBox(width: 8),
                            Text(
                              'Viewing via: ${lens['name']}',
                              style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),

            // Photochromic Dynamic Slider
            if (_selectedLens == 2) ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.slate200),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Sunlight UV Activation Level',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.slate800),
                        ),
                        Text(
                          '${(_sunlightIntensity * 100).round()}% Tint',
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: AppColors.primary),
                        ),
                      ],
                    ),
                    Slider(
                      value: _sunlightIntensity,
                      activeColor: AppColors.primary,
                      inactiveColor: AppColors.slate200,
                      onChanged: (val) => setState(() => _sunlightIntensity = val),
                    ),
                    const Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Indoor (0% Clear)', style: TextStyle(fontSize: 10, color: AppColors.slate500)),
                        Text('Peak Outdoor (100% Dark)', style: TextStyle(fontSize: 10, color: AppColors.slate500)),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
            ],

            // 3. Lens Package Selectors
            const Text(
              'Choose Lens Coating Package:',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.slate900),
            ),
            const SizedBox(height: 10),

            ...List.generate(_lenses.length, (index) {
              final item = _lenses[index];
              final isSelected = _selectedLens == index;

              return GestureDetector(
                onTap: () => setState(() => _selectedLens = index),
                child: Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: isSelected ? AppColors.primarySubtle : Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: isSelected ? AppColors.primary : AppColors.slate200,
                      width: isSelected ? 2 : 1,
                    ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 22,
                        height: 22,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: isSelected ? AppColors.primary : Colors.transparent,
                          border: Border.all(
                            color: isSelected ? AppColors.primary : AppColors.slate300,
                            width: 1.5,
                          ),
                        ),
                        child: isSelected ? const Icon(LucideIcons.check, size: 14, color: Colors.white) : null,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Text(
                                  item['name'] as String,
                                  style: TextStyle(
                                    fontWeight: FontWeight.w800,
                                    fontSize: 13,
                                    color: isSelected ? AppColors.primaryDark : AppColors.slate900,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: isSelected ? AppColors.primary : AppColors.slate100,
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Text(
                                    item['badge'] as String,
                                    style: TextStyle(
                                      color: isSelected ? Colors.white : AppColors.slate600,
                                      fontSize: 9,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 2),
                            Text(
                              item['description'] as String,
                              style: const TextStyle(fontSize: 11, color: AppColors.slate600),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        item['price'] as String,
                        style: TextStyle(
                          fontWeight: FontWeight.w900,
                          fontSize: 12,
                          color: isSelected ? AppColors.primaryDark : AppColors.slate800,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }),
            const SizedBox(height: 12),

            // 4. Optical Lab Spec Sheet
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.slate200),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Technical Lab Specifications', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                  const SizedBox(height: 10),
                  _buildSpecRow('UV Protection Standard', lens['uv'] as String),
                  _buildSpecRow('Blue Light Filtration', lens['blueCut'] as String),
                  _buildSpecRow('Reflective Glare Treatment', lens['glare'] as String),
                  _buildSpecRow('Hard Hydrophobic Coating', 'Included on all lenses'),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLensOverlay(Map<String, dynamic> lens) {
    if (_selectedLens == 0) {
      // Standard Clear (Very slight clarity filter)
      return Container(color: Colors.black.withOpacity(0.04));
    } else if (_selectedLens == 1) {
      // Blue Cut: subtle warm amber filter
      return Container(color: const Color(0x2BFFB703));
    } else if (_selectedLens == 2) {
      // Photochromic: opacity controlled by _sunlightIntensity
      return Container(color: Colors.black.withOpacity(0.20 + (_sunlightIntensity * 0.55)));
    } else {
      // Polarized: sharp contrast glare filter
      return Container(color: const Color(0x66001B2E));
    }
  }

  Widget _buildSpecRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 11, color: AppColors.slate500)),
          Text(value, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.slate800)),
        ],
      ),
    );
  }
}
