import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../theme.dart';
import '../../../providers/configurator_provider.dart';
import '../../../widgets/common/brand_button.dart';

class StepYourInfo extends StatefulWidget {
  final VoidCallback onNext;

  const StepYourInfo({
    super.key,
    required this.onNext,
  });

  @override
  State<StepYourInfo> createState() => _StepYourInfoState();
}

class _StepYourInfoState extends State<StepYourInfo> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameController;
  late TextEditingController _ageController;
  late TextEditingController _phoneController;

  static const List<double> addPowers = [
    0.50, 0.75, 1.00, 1.25, 1.50, 1.75, 2.00, 2.25, 2.50, 2.75, 3.00
  ];

  @override
  void initState() {
    super.initState();
    final config = context.read<ConfiguratorProvider>();
    _nameController = TextEditingController(text: config.customerName);
    _ageController = TextEditingController(
        text: config.customerAge != null ? config.customerAge.toString() : '');
    _phoneController = TextEditingController(text: config.customerPhone);
  }

  @override
  void dispose() {
    _nameController.dispose();
    _ageController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  void _submit() {
    final config = context.read<ConfiguratorProvider>();

    if (config.isLoggedIn) {
      final age = int.tryParse(_ageController.text.trim());
      config.setCustomerInfo(
        name: config.loggedInUserName ?? 'Customer',
        age: age,
        phone: config.customerPhone,
      );
      widget.onNext();
      return;
    }

    if (_formKey.currentState?.validate() ?? false) {
      final age = int.tryParse(_ageController.text.trim());
      config.setCustomerInfo(
        name: _nameController.text.trim(),
        age: age,
        phone: _phoneController.text.trim(),
      );
      widget.onNext();
    }
  }

  @override
  Widget build(BuildContext context) {
    final config = context.watch<ConfiguratorProvider>();

    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Step Header
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: const BoxDecoration(
                  color: AppColors.primarySubtle,
                  shape: BoxShape.circle,
                ),
                child: const Icon(LucideIcons.user, color: AppColors.primary, size: 18),
              ),
              const SizedBox(width: 12),
              const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Step 1 of 3: Your Information',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: AppColors.primary,
                    ),
                  ),
                  Text(
                    'Who are these glasses for?',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      color: AppColors.slate900,
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 20),

          // 1. Authenticated User Profile Banner OR Guest Form
          if (config.isLoggedIn) ...[
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.primarySubtle,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.primary.withOpacity(0.3)),
              ),
              child: Row(
                children: [
                  const Icon(LucideIcons.userCheck, color: AppColors.primary, size: 24),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Welcome back, ${config.loggedInUserName ?? "Valued Customer"}',
                          style: const TextStyle(
                            fontWeight: FontWeight.w800,
                            fontSize: 14,
                            color: AppColors.slate900,
                          ),
                        ),
                        const SizedBox(height: 2),
                        const Text(
                          'Your contact profile is auto-linked to this order.',
                          style: TextStyle(fontSize: 11, color: AppColors.slate600),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
          ] else ...[
            // Full Name
            const Text(
              'Full Name *',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.slate800),
            ),
            const SizedBox(height: 6),
            TextFormField(
              controller: _nameController,
              decoration: const InputDecoration(
                hintText: 'e.g. Ali Ahmed',
                prefixIcon: Icon(LucideIcons.user, size: 18, color: AppColors.slate400),
              ),
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Please enter your full name' : null,
            ),
            const SizedBox(height: 16),

            // WhatsApp Number
            const Text(
              'WhatsApp Number *',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.slate800),
            ),
            const SizedBox(height: 6),
            TextFormField(
              controller: _phoneController,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(
                hintText: '03001234567 or +923001234567',
                prefixIcon: Icon(LucideIcons.phone, size: 18, color: AppColors.slate400),
              ),
              validator: (v) {
                if (v == null || v.trim().isEmpty) return 'Please enter your WhatsApp number';
                if (v.trim().length < 10) return 'Please enter a valid phone number';
                return null;
              },
            ),
            const SizedBox(height: 16),
          ],

          // Age Input with clinical hint
          Row(
            children: const [
              Text(
                'Age * ',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.slate800),
              ),
              Text(
                '(tailors lenses to your exact optical needs)',
                style: TextStyle(fontSize: 11, color: AppColors.primary, fontWeight: FontWeight.w600),
              ),
            ],
          ),
          const SizedBox(height: 6),
          TextFormField(
            controller: _ageController,
            keyboardType: TextInputType.number,
            onChanged: (val) {
              final age = int.tryParse(val.trim());
              config.setCustomerInfo(
                name: _nameController.text.trim(),
                age: age,
                phone: _phoneController.text.trim(),
              );
            },
            decoration: const InputDecoration(
              hintText: 'e.g. 28',
              prefixIcon: Icon(LucideIcons.calendar, size: 18, color: AppColors.slate400),
            ),
            validator: (v) {
              if (v == null || v.trim().isEmpty) return 'Please enter your age';
              final num = int.tryParse(v.trim());
              if (num == null || num < 5 || num > 110) return 'Please enter a realistic age';
              return null;
            },
          ),
          const SizedBox(height: 20),

          // 2. Clinical Presbyopia Trigger (If Age >= 40)
          if (config.isAgeGte40) ...[
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.slate50,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.primary.withOpacity(0.35), width: 1.5),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(LucideIcons.sparkles, color: AppColors.primary, size: 18),
                      const SizedBox(width: 8),
                      const Expanded(
                        child: Text(
                          'Presbyopia & Reading Vision Triage',
                          style: TextStyle(
                            fontWeight: FontWeight.w800,
                            fontSize: 13,
                            color: AppColors.slate900,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Do you need reading or progressive (multifocal) lenses for near-vision tasks?',
                    style: TextStyle(fontSize: 12, color: AppColors.slate600, height: 1.35),
                  ),
                  const SizedBox(height: 12),

                  // Yes / No Toggle Pills
                  Row(
                    children: [
                      Expanded(
                        child: GestureDetector(
                          onTap: () => config.setNeedsReadingLenses(true),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            decoration: BoxDecoration(
                              color: config.needsReadingLenses ? AppColors.primary : Colors.white,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color: config.needsReadingLenses ? AppColors.primary : AppColors.slate200,
                              ),
                            ),
                            child: Center(
                              child: Text(
                                'Yes, Need Reading / Progressive',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: config.needsReadingLenses ? Colors.white : AppColors.slate700,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: GestureDetector(
                          onTap: () => config.setNeedsReadingLenses(false),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            decoration: BoxDecoration(
                              color: !config.needsReadingLenses ? AppColors.slate900 : Colors.white,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color: !config.needsReadingLenses ? AppColors.slate900 : AppColors.slate200,
                              ),
                            ),
                            child: Center(
                              child: Text(
                                'No, Single Vision Only',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: !config.needsReadingLenses ? Colors.white : AppColors.slate700,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),

                  // ADD Power Dropdown (if Yes)
                  if (config.needsReadingLenses) ...[
                    const SizedBox(height: 14),
                    const Text(
                      'Reading ADD Power (Near Vision):',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.slate700),
                    ),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.slate200),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<double>(
                          value: config.selectedAddPower,
                          isExpanded: true,
                          items: addPowers.map((val) {
                            return DropdownMenuItem<double>(
                              value: val,
                              child: Text('+${val.toStringAsFixed(2)} D (Near Add)'),
                            );
                          }).toList(),
                          onChanged: (val) {
                            if (val != null) config.setAddPower(val);
                          },
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 20),
          ],

          // Primary CTA Button
          BrandButton(
            label: 'Choose Lenses',
            icon: LucideIcons.arrowRight,
            onPressed: _submit,
          ),
        ],
      ),
    );
  }
}
