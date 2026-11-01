import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../theme.dart';
import '../../models/face_shape.dart';
import 'lens_simulator_screen.dart';
import 'pd_measurement_screen.dart';
import 'quiz_screen.dart';
import '../ai/gemini_ai_stylist_screen.dart';

class ToolsHubScreen extends StatefulWidget {
  final Function(String shape)? onFilterByShape;

  const ToolsHubScreen({
    super.key,
    this.onFilterByShape,
  });

  @override
  State<ToolsHubScreen> createState() => _ToolsHubScreenState();
}

class _ToolsHubScreenState extends State<ToolsHubScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  int _selectedShapeIndex = 0;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.slate50,
      appBar: AppBar(
        title: const Text('Optical Tools & Fit Lab'),
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.slate500,
          indicatorColor: AppColors.primary,
          indicatorWeight: 3,
          labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
          tabs: const [
            Tab(text: 'Face Fit Matcher', icon: Icon(LucideIcons.scanFace, size: 18)),
            Tab(text: 'Digital Lab Suite', icon: Icon(LucideIcons.cpu, size: 18)),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildFaceShapeView(),
          _buildToolsDirectoryView(),
        ],
      ),
    );
  }

  Widget _buildFaceShapeView() {
    final shape = FaceShapeData.allShapes[_selectedShapeIndex];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'FIND YOUR FIT',
            style: TextStyle(color: AppColors.primary, fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 1.0),
          ),
          const SizedBox(height: 4),
          const Text(
            'Face Shape Diagnostic & Matcher',
            style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: AppColors.slate900),
          ),
          const SizedBox(height: 8),
          const Text(
            'Select your face geometry below to see which frame silhouettes create natural optical harmony.',
            style: TextStyle(fontSize: 13, color: AppColors.slate600),
          ),
          const SizedBox(height: 16),

          // Shape Pills
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: List.generate(FaceShapeData.allShapes.length, (index) {
                final s = FaceShapeData.allShapes[index];
                final isSelected = _selectedShapeIndex == index;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text('${s.label} Shape'),
                    selected: isSelected,
                    onSelected: (val) {
                      if (val) setState(() => _selectedShapeIndex = index);
                    },
                    selectedColor: AppColors.primarySubtle,
                    labelStyle: TextStyle(
                      color: isSelected ? AppColors.primaryDark : AppColors.slate700,
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                    ),
                    side: BorderSide(
                      color: isSelected ? AppColors.primary : AppColors.slate200,
                    ),
                  ),
                );
              }),
            ),
          ),
          const SizedBox(height: 20),

          // Diagnostic Card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.slate200),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${shape.label} Face Shape',
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppColors.slate900),
                ),
                Text(
                  shape.tagline,
                  style: const TextStyle(fontSize: 12, color: AppColors.slate500),
                ),
                const Divider(height: 24, color: AppColors.slate100),
                const Text('Key Identifying Features:', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.slate400)),
                const SizedBox(height: 8),
                ...shape.characteristics.map((c) => Padding(
                      padding: const EdgeInsets.only(bottom: 6),
                      child: Row(
                        children: [
                          const Icon(LucideIcons.checkCircle2, color: AppColors.success, size: 14),
                          const SizedBox(width: 8),
                          Expanded(child: Text(c, style: const TextStyle(fontSize: 12, color: AppColors.slate700))),
                        ],
                      ),
                    )),
                const Divider(height: 24, color: AppColors.slate100),
                const Text('Best Frame Silhouettes for You:', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.slate400)),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: shape.recommendedFrames
                      .map((f) => Chip(
                            label: Text(f, style: const TextStyle(fontSize: 11, color: AppColors.slate800, fontWeight: FontWeight.w600)),
                            backgroundColor: AppColors.slate100,
                            side: BorderSide.none,
                            padding: EdgeInsets.zero,
                          ))
                      .toList(),
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.primarySubtle,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.primary.withOpacity(0.2)),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(LucideIcons.sparkles, color: AppColors.primary, size: 16),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Optician Styling Rule', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primaryDark)),
                            const SizedBox(height: 2),
                            Text(shape.stylingTip, style: const TextStyle(fontSize: 11, color: AppColors.slate800, height: 1.3)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildToolsDirectoryView() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildDirectoryCard(
          icon: LucideIcons.sparkles,
          title: 'Gemini AI Frame & Lens Stylist',
          subtitle: 'Real-time AI optical consultation for face shape geometry, lens coatings, and prescription advice.',
          badge: 'Gemini AI',
          color: const Color(0xFF7C3AED),
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const GeminiAiStylistScreen()),
            );
          },
        ),
        const SizedBox(height: 12),
        _buildDirectoryCard(
          icon: LucideIcons.eye,
          title: 'Optical Lens Coating Simulator',
          subtitle: 'Experience Clear, Blue Light Shield, and Photochromic Transitions against real scenery.',
          badge: 'Interactive',
          color: AppColors.primary,
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const LensSimulatorScreen()),
            );
          },
        ),
        const SizedBox(height: 12),
        _buildDirectoryCard(
          icon: LucideIcons.ruler,
          title: 'Pupillary Distance (PD) Caliper Meter',
          subtitle: 'Measure pupil distance accurately in mm with interactive sliders and step-by-step mirror guide.',
          badge: 'Precision',
          color: AppColors.success,
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const PdMeasurementScreen()),
            );
          },
        ),
        const SizedBox(height: 12),
        _buildDirectoryCard(
          icon: LucideIcons.helpCircle,
          title: 'Eyewear Style & Fit Quiz',
          subtitle: 'Answer 4 quick lifestyle questions to get tailor-matched frame recommendations in 60 seconds.',
          badge: 'Quick Quiz',
          color: const Color(0xFF6366F1),
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const QuizScreen()),
            );
          },
        ),
      ],
    );
  }

  Widget _buildDirectoryCard({
    required IconData icon,
    required String title,
    required String subtitle,
    required String badge,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: AppColors.slate200),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.02),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 22),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          title,
                          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: AppColors.slate900),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: color.withOpacity(0.12),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          badge,
                          style: TextStyle(color: color, fontSize: 9, fontWeight: FontWeight.w800),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: const TextStyle(fontSize: 11, color: AppColors.slate600, height: 1.35),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            const Icon(LucideIcons.chevronRight, size: 18, color: AppColors.slate400),
          ],
        ),
      ),
    );
  }
}
