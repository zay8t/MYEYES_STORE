import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../theme.dart';
import '../../models/product.dart';
import '../../providers/catalog_provider.dart';
import '../product_detail/product_detail_screen.dart';
import '../../widgets/common/brand_button.dart';

class QuizScreen extends StatefulWidget {
  const QuizScreen({super.key});

  @override
  State<QuizScreen> createState() => _QuizScreenState();
}

class _QuizScreenState extends State<QuizScreen> {
  int _currentStep = 0;

  // Selected Answers
  String? _gender;
  String? _style;
  String? _opticalNeed;
  String? _faceShape;

  final List<Map<String, dynamic>> _questions = [
    {
      'title': 'Who are these glasses for?',
      'subtitle': 'We will filter dimensions and frame styling for you.',
      'options': [
        {'label': 'Men', 'icon': LucideIcons.user, 'val': 'Men'},
        {'label': 'Women', 'icon': LucideIcons.sparkles, 'val': 'Women'},
        {'label': 'Unisex / Anyone', 'icon': LucideIcons.users, 'val': 'Unisex'},
      ],
    },
    {
      'title': "What's your preferred frame aesthetic?",
      'subtitle': 'Select the look that fits your day-to-day lifestyle.',
      'options': [
        {'label': 'Modern Minimalist (Wireframe & Titanium)', 'icon': LucideIcons.feather, 'val': 'MINIMAL'},
        {'label': 'Bold Executive (Thick Polished Acetate)', 'icon': LucideIcons.briefcase, 'val': 'BOLD'},
        {'label': 'Vintage & Retro (Classic Round / Aviator)', 'icon': LucideIcons.clock, 'val': 'RETRO'},
        {'label': 'Lightweight Flexible (TR-90 Active)', 'icon': LucideIcons.activity, 'val': 'ACTIVE'},
      ],
    },
    {
      'title': 'What is your primary optical need?',
      'subtitle': 'Our lab will recommend the ideal lens package for you.',
      'options': [
        {'label': 'Digital Screens & Laptop Work', 'icon': LucideIcons.laptop, 'val': 'BLUE_CUT'},
        {'label': 'Everyday Distance & Driving', 'icon': LucideIcons.car, 'val': 'DRIVING'},
        {'label': 'Both Indoors & Outdoors (Clear to Dark)', 'icon': LucideIcons.sunMedium, 'val': 'PHOTOCHROMIC'},
        {'label': 'Reading & Precision Near Work', 'icon': LucideIcons.bookOpen, 'val': 'READING'},
      ],
    },
    {
      'title': 'What best describes your face shape?',
      'subtitle': 'This guarantees a balanced optical proportion.',
      'options': [
        {'label': 'Oval (Curved, balanced proportions)', 'icon': LucideIcons.circle, 'val': 'OVAL'},
        {'label': 'Round (Soft cheeks, equal width & length)', 'icon': LucideIcons.circleDot, 'val': 'ROUND'},
        {'label': 'Square (Strong angular jawline)', 'icon': LucideIcons.square, 'val': 'SQUARE'},
        {'label': 'Heart / Diamond (Wider forehead, tapered chin)', 'icon': LucideIcons.heart, 'val': 'HEART'},
        {'label': 'Help Me Decide / Any Shape', 'icon': LucideIcons.helpCircle, 'val': 'ANY'},
      ],
    },
  ];

  void _handleOptionSelect(String val) {
    setState(() {
      if (_currentStep == 0) _gender = val;
      if (_currentStep == 1) _style = val;
      if (_currentStep == 2) _opticalNeed = val;
      if (_currentStep == 3) _faceShape = val;

      if (_currentStep < _questions.length - 1) {
        _currentStep++;
      } else {
        _currentStep = 4; // Result screen
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final isResult = _currentStep == 4;

    return Scaffold(
      backgroundColor: AppColors.slate50,
      appBar: AppBar(
        title: Text(isResult ? 'Your Optical Recommendation' : 'Eyewear Fit Quiz'),
      ),
      body: isResult ? _buildResultView() : _buildQuestionView(),
    );
  }

  Widget _buildQuestionView() {
    final q = _questions[_currentStep];
    final options = q['options'] as List<Map<String, dynamic>>;

    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Step progress
          Row(
            children: List.generate(_questions.length, (index) {
              final isPassed = index <= _currentStep;
              return Expanded(
                child: Container(
                  height: 4,
                  margin: const EdgeInsets.only(right: 6),
                  decoration: BoxDecoration(
                    color: isPassed ? AppColors.primary : AppColors.slate200,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              );
            }),
          ),
          const SizedBox(height: 24),

          Text(
            'QUESTION ${_currentStep + 1} OF ${_questions.length}',
            style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppColors.primary, letterSpacing: 1),
          ),
          const SizedBox(height: 6),
          Text(
            q['title'] as String,
            style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: AppColors.slate900),
          ),
          const SizedBox(height: 6),
          Text(
            q['subtitle'] as String,
            style: const TextStyle(fontSize: 13, color: AppColors.slate600),
          ),
          const SizedBox(height: 24),

          // Options List
          Expanded(
            child: ListView.separated(
              itemCount: options.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, idx) {
                final opt = options[idx];
                return InkWell(
                  onTap: () => _handleOptionSelect(opt['val'] as String),
                  borderRadius: BorderRadius.circular(16),
                  child: Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.slate200),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.02),
                          blurRadius: 6,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: const BoxDecoration(
                            color: AppColors.primarySubtle,
                            shape: BoxShape.circle,
                          ),
                          child: Icon(opt['icon'] as IconData, size: 20, color: AppColors.primary),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Text(
                            opt['label'] as String,
                            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.slate900),
                          ),
                        ),
                        const Icon(LucideIcons.chevronRight, size: 18, color: AppColors.slate400),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),

          if (_currentStep > 0)
            Center(
              child: TextButton.icon(
                icon: const Icon(LucideIcons.arrowLeft, size: 16),
                label: const Text('Back to Previous Question'),
                onPressed: () => setState(() => _currentStep--),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildResultView() {
    final catalog = context.watch<CatalogProvider>();
    final matchedProducts = catalog.allProducts.take(3).toList();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Diagnosis Summary Card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(LucideIcons.sparkles, color: AppColors.primaryLight, size: 20),
                    SizedBox(width: 8),
                    Text(
                      'AI OPTICAL LAB MATCH',
                      style: TextStyle(color: AppColors.primaryLight, fontWeight: FontWeight.w800, fontSize: 11, letterSpacing: 1),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  'Geometric Balance for $_faceShape Shape',
                  style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w900),
                ),
                const SizedBox(height: 6),
                Text(
                  'Based on your preference for ${_style ?? "modern"} styling and ${_opticalNeed ?? "screen protection"}, our opticians recommend medium-width frames equipped with Blue Cut or Anti-Reflective coatings.',
                  style: const TextStyle(color: AppColors.slate300, fontSize: 12, height: 1.4),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          const Text(
            'Curated Frames Matched For You',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: AppColors.slate900),
          ),
          const SizedBox(height: 12),

          ...matchedProducts.map((p) {
            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.slate200),
              ),
              child: Row(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: Image.network(
                      p.firstImage,
                      width: 70,
                      height: 70,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Container(width: 70, height: 70, color: AppColors.slate100),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(p.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.slate900)),
                        const SizedBox(height: 2),
                        Text('${p.formattedShape} • ${p.formattedMaterial}', style: const TextStyle(fontSize: 11, color: AppColors.slate500)),
                        const SizedBox(height: 6),
                        Text(p.formattedPrice, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13, color: AppColors.primary)),
                      ],
                    ),
                  ),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      backgroundColor: AppColors.slate900,
                      foregroundColor: Colors.white,
                    ),
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => ProductDetailScreen(product: p)),
                      );
                    },
                    child: const Text('View', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            );
          }),
          const SizedBox(height: 20),

          BrandButton(
            label: 'Retake Eyewear Quiz',
            variant: BrandButtonVariant.outline,
            icon: LucideIcons.rotateCcw,
            onPressed: () => setState(() => _currentStep = 0),
          ),
        ],
      ),
    );
  }
}
