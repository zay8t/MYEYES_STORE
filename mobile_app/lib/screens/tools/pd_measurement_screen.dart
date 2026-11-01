import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../theme.dart';
import '../../providers/configurator_provider.dart';
import '../../widgets/common/brand_button.dart';

class PdMeasurementScreen extends StatefulWidget {
  const PdMeasurementScreen({super.key});

  @override
  State<PdMeasurementScreen> createState() => _PdMeasurementScreenState();
}

class _PdMeasurementScreenState extends State<PdMeasurementScreen> {
  double _measuredPd = 63.0; // Standard midpoint
  bool _isMonocular = false;
  double _rightPd = 31.5;
  double _leftPd = 31.5;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.slate50,
      appBar: AppBar(
        title: const Text('Pupillary Distance (PD) Tool'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Title Header
            const Text(
              'OPTICAL PRECISION',
              style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppColors.primary, letterSpacing: 1),
            ),
            const SizedBox(height: 4),
            const Text(
              'Measure Your Pupillary Distance',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: AppColors.slate900),
            ),
            const SizedBox(height: 6),
            const Text(
              'Your PD is the distance between the centers of your pupils in millimeters (mm). Accurate PD ensures the optical center of your lenses lines up with your eyes.',
              style: TextStyle(fontSize: 12, color: AppColors.slate600, height: 1.4),
            ),
            const SizedBox(height: 20),

            // Interactive Pupil Ruler Visualizer
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.slate200),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.03),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                children: [
                  // Visual Eyes Diagram with Caliper
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      // Right Pupil
                      Column(
                        children: [
                          Container(
                            width: 50,
                            height: 50,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: AppColors.slate100,
                              border: Border.all(color: AppColors.slate300, width: 2),
                            ),
                            child: Center(
                              child: Container(
                                width: 14,
                                height: 14,
                                decoration: const BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: AppColors.slate900,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 4),
                          const Text('Right Eye (OD)', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.slate600)),
                        ],
                      ),

                      // Connecting Caliper Dimension
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 10),
                          child: Column(
                            children: [
                              Text(
                                '${_isMonocular ? (_rightPd + _leftPd).toStringAsFixed(1) : _measuredPd.round()} mm',
                                style: const TextStyle(
                                  fontSize: 22,
                                  fontWeight: FontWeight.w900,
                                  color: AppColors.primary,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Row(
                                children: [
                                  const Icon(LucideIcons.arrowLeft, size: 14, color: AppColors.primary),
                                  Expanded(
                                    child: Container(height: 2, color: AppColors.primary),
                                  ),
                                  const Icon(LucideIcons.arrowRight, size: 14, color: AppColors.primary),
                                ],
                              ),
                              const SizedBox(height: 4),
                              const Text('Pupil-to-Pupil Center', style: TextStyle(fontSize: 10, color: AppColors.slate400)),
                            ],
                          ),
                        ),
                      ),

                      // Left Pupil
                      Column(
                        children: [
                          Container(
                            width: 50,
                            height: 50,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: AppColors.slate100,
                              border: Border.all(color: AppColors.slate300, width: 2),
                            ),
                            child: Center(
                              child: Container(
                                width: 14,
                                height: 14,
                                decoration: const BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: AppColors.slate900,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 4),
                          const Text('Left Eye (OS)', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.slate600)),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Slider Control
                  if (!_isMonocular) ...[
                    Slider(
                      value: _measuredPd,
                      min: 54.0,
                      max: 74.0,
                      divisions: 40,
                      activeColor: AppColors.primary,
                      inactiveColor: AppColors.slate200,
                      onChanged: (val) => setState(() => _measuredPd = val),
                    ),
                    const Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('54 mm (Narrow)', style: TextStyle(fontSize: 10, color: AppColors.slate400)),
                        Text('62-64 mm (Adult Average)', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.slate700)),
                        Text('74 mm (Wide)', style: TextStyle(fontSize: 10, color: AppColors.slate400)),
                      ],
                    ),
                  ] else ...[
                    // Monocular Controls
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Right Eye PD: ${_rightPd.toStringAsFixed(1)} mm', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                              Slider(
                                value: _rightPd,
                                min: 26.0,
                                max: 37.0,
                                activeColor: AppColors.primary,
                                onChanged: (v) => setState(() => _rightPd = v),
                              ),
                            ],
                          ),
                        ),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Left Eye PD: ${_leftPd.toStringAsFixed(1)} mm', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                              Slider(
                                value: _leftPd,
                                min: 26.0,
                                max: 37.0,
                                activeColor: AppColors.primary,
                                onChanged: (v) => setState(() => _leftPd = v),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                  const SizedBox(height: 12),

                  // Monocular Toggle
                  TextButton.icon(
                    icon: Icon(_isMonocular ? LucideIcons.checkSquare : LucideIcons.square, size: 16),
                    label: Text(_isMonocular ? 'Switch to Binocular (Single) PD' : 'Have Two Numbers on Slip? (Dual Monocular PD)'),
                    onPressed: () => setState(() => _isMonocular = !_isMonocular),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Step-by-Step Instructions Card
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
                  const Text('How to Measure Your PD in 3 Steps', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                  const SizedBox(height: 12),
                  _buildInstructionStep(
                    step: '1',
                    title: 'Face a Mirror Straight-On',
                    desc: 'Stand about 8 inches away from a well-lit mirror. Hold your head level.',
                  ),
                  _buildInstructionStep(
                    step: '2',
                    title: 'Line Up a Millimeter Ruler',
                    desc: 'Rest a ruler against your browline. Align the 0mm mark exactly with the center of your right pupil.',
                  ),
                  _buildInstructionStep(
                    step: '3',
                    title: 'Read the Distance to Left Pupil',
                    desc: 'Look straight ahead and note the millimeter line over your left pupil. Typical adult values are 58mm to 68mm.',
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Apply to Configurator Button
            BrandButton(
              label: 'Save & Apply ${_isMonocular ? (_rightPd + _leftPd).round() : _measuredPd.round()} mm to Prescription',
              icon: LucideIcons.check,
              onPressed: () {
                final pdVal = _isMonocular ? (_rightPd + _leftPd).round() : _measuredPd.round();
                context.read<ConfiguratorProvider>().updatePrescriptionField('pd', pdVal);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('PD set to $pdVal mm for your prescription order!'),
                    backgroundColor: AppColors.slate900,
                  ),
                );
                Navigator.pop(context);
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInstructionStep({
    required String step,
    required String title,
    required String desc,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 22,
            height: 22,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.primarySubtle,
            ),
            child: Center(
              child: Text(
                step,
                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: AppColors.primaryDark),
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 12, color: AppColors.slate900)),
                const SizedBox(height: 2),
                Text(desc, style: const TextStyle(fontSize: 11, color: AppColors.slate600, height: 1.35)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
