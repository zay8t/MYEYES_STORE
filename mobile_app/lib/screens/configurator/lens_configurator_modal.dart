import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../theme.dart';
import '../../providers/configurator_provider.dart';
import 'steps/step_your_info.dart';
import 'steps/step_choose_lenses.dart';
import 'steps/step_prescription_review.dart';

class LensConfiguratorModal extends StatelessWidget {
  const LensConfiguratorModal({super.key});

  static void show(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      enableDrag: true,
      builder: (_) => const LensConfiguratorModal(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final config = context.watch<ConfiguratorProvider>();
    final currentStep = config.currentStep;

    return DraggableScrollableSheet(
      initialChildSize: 0.90,
      minChildSize: 0.50,
      maxChildSize: 0.95,
      builder: (context, scrollController) {
        return Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            children: [
              // Top Drag Handle & Close Button
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 12, 16, 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: AppColors.slate200,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(LucideIcons.x, size: 20, color: AppColors.slate500),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
              ),

              // 3-Step Progress Indicators
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  children: [
                    _buildStepIndicator(0, '1. Info', currentStep),
                    _buildStepLine(0, currentStep),
                    _buildStepIndicator(1, '2. Lenses', currentStep),
                    _buildStepLine(1, currentStep),
                    _buildStepIndicator(2, '3. Review', currentStep),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              const Divider(height: 1, color: AppColors.slate100),

              // Step Content Body
              Expanded(
                child: ListView(
                  controller: scrollController,
                  padding: const EdgeInsets.all(20),
                  children: [
                    if (currentStep == 0)
                      StepYourInfo(
                        onNext: () => config.setStep(1),
                      )
                    else if (currentStep == 1)
                      StepChooseLenses(
                        onBack: () => config.setStep(0),
                        onNext: () => config.setStep(2),
                      )
                    else
                      StepPrescriptionReview(
                        onBack: () => config.setStep(1),
                        onFinish: () {
                          Navigator.pop(context);
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Custom prescription glasses added to cart!'),
                              backgroundColor: AppColors.slate900,
                              duration: Duration(seconds: 3),
                            ),
                          );
                        },
                      ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildStepIndicator(int stepIndex, String title, int currentStep) {
    final isCompleted = currentStep > stepIndex;
    final isActive = currentStep == stepIndex;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 24,
          height: 24,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: isCompleted
                ? AppColors.primary
                : (isActive ? AppColors.primary : AppColors.slate100),
          ),
          child: Center(
            child: isCompleted
                ? const Icon(LucideIcons.check, size: 12, color: Colors.white)
                : Text(
                    '${stepIndex + 1}',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: isActive ? Colors.white : AppColors.slate400,
                    ),
                  ),
          ),
        ),
        const SizedBox(width: 6),
        Text(
          title,
          style: TextStyle(
            fontSize: 11,
            fontWeight: isActive ? FontWeight.w800 : FontWeight.w500,
            color: isActive ? AppColors.slate900 : AppColors.slate400,
          ),
        ),
      ],
    );
  }

  Widget _buildStepLine(int leftStepIndex, int currentStep) {
    final isPassed = currentStep > leftStepIndex;
    return Expanded(
      child: Container(
        height: 2,
        margin: const EdgeInsets.symmetric(horizontal: 8),
        color: isPassed ? AppColors.primary : AppColors.slate200,
      ),
    );
  }
}
