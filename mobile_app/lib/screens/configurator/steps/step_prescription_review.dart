import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../theme.dart';
import '../../../providers/configurator_provider.dart';
import '../../../providers/cart_provider.dart';
import '../../../widgets/common/brand_button.dart';
import '../../../widgets/common/price_tag.dart';

class StepPrescriptionReview extends StatefulWidget {
  final VoidCallback onBack;
  final VoidCallback onFinish;

  const StepPrescriptionReview({
    super.key,
    required this.onBack,
    required this.onFinish,
  });

  @override
  State<StepPrescriptionReview> createState() => _StepPrescriptionReviewState();
}

class _StepPrescriptionReviewState extends State<StepPrescriptionReview> {
  final ImagePicker _picker = ImagePicker();
  bool _showManualPowers = false;

  late TextEditingController _odSphCtrl;
  late TextEditingController _odCylCtrl;
  late TextEditingController _odAxisCtrl;
  late TextEditingController _osSphCtrl;
  late TextEditingController _osCylCtrl;
  late TextEditingController _osAxisCtrl;
  late TextEditingController _pdCtrl;

  @override
  void initState() {
    super.initState();
    final config = context.read<ConfiguratorProvider>();
    _odSphCtrl = TextEditingController(text: config.odSph != 0 ? config.odSph.toString() : '');
    _odCylCtrl = TextEditingController(text: config.odCyl != null ? config.odCyl.toString() : '');
    _odAxisCtrl = TextEditingController(text: config.odAxis != null ? config.odAxis.toString() : '');
    _osSphCtrl = TextEditingController(text: config.osSph != 0 ? config.osSph.toString() : '');
    _osCylCtrl = TextEditingController(text: config.osCyl != null ? config.osCyl.toString() : '');
    _osAxisCtrl = TextEditingController(text: config.osAxis != null ? config.osAxis.toString() : '');
    _pdCtrl = TextEditingController(text: config.pd.toString());
  }

  @override
  void dispose() {
    _odSphCtrl.dispose();
    _odCylCtrl.dispose();
    _odAxisCtrl.dispose();
    _osSphCtrl.dispose();
    _osCylCtrl.dispose();
    _osAxisCtrl.dispose();
    _pdCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final XFile? file = await _picker.pickImage(
        source: source,
        imageQuality: 85,
      );
      if (file != null) {
        context.read<ConfiguratorProvider>().setPrescriptionSlip(file.path);
      }
    } catch (_) {}
  }

  void _saveAndAddToCart() {
    final config = context.read<ConfiguratorProvider>();

    if (_showManualPowers) {
      config.setManualPowers(
        odSph: double.tryParse(_odSphCtrl.text.trim()) ?? 0.0,
        odCyl: double.tryParse(_odCylCtrl.text.trim()),
        odAxis: int.tryParse(_odAxisCtrl.text.trim()),
        osSph: double.tryParse(_osSphCtrl.text.trim()) ?? 0.0,
        osCyl: double.tryParse(_osCylCtrl.text.trim()),
        osAxis: int.tryParse(_osAxisCtrl.text.trim()),
        pd: double.tryParse(_pdCtrl.text.trim()) ?? 63.0,
      );
    }

    final cartItem = config.buildCartItem();
    context.read<CartProvider>().addConfiguredItem(cartItem);
    widget.onFinish();
  }

  @override
  Widget build(BuildContext context) {
    final config = context.watch<ConfiguratorProvider>();
    final product = config.currentProduct;
    final selectedLens = config.selectedLensOption;
    final isPresbyopia = config.isPresbyopia;

    if (product == null) return const SizedBox.shrink();

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
              child: const Icon(LucideIcons.fileText, color: AppColors.primary, size: 18),
            ),
            const SizedBox(width: 12),
            const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Step 3 of 3: Prescription & Review',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: AppColors.primary,
                  ),
                ),
                Text(
                  'Attach Slip & Final Review',
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
        const SizedBox(height: 16),

        // 1. Prescription Slip Upload Option
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
              const Row(
                children: [
                  Icon(LucideIcons.camera, size: 16, color: AppColors.primary),
                  SizedBox(width: 8),
                  Text(
                    'Doctor\'s Prescription Slip',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: AppColors.slate900),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              const Text(
                'Upload a photo of your doctor prescription or choose to share it later via WhatsApp.',
                style: TextStyle(fontSize: 11, color: AppColors.slate500),
              ),
              const SizedBox(height: 14),

              if (config.prescriptionSlipPath != null) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.successBg,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.success.withOpacity(0.3)),
                  ),
                  child: Row(
                    children: [
                      const Icon(LucideIcons.checkCircle2, color: AppColors.success, size: 18),
                      const SizedBox(width: 10),
                      const Expanded(
                        child: Text(
                          'Prescription Slip Attached!',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.slate800),
                        ),
                      ),
                      IconButton(
                        icon: const Icon(LucideIcons.trash2, size: 16, color: AppColors.error),
                        onPressed: () => config.setPrescriptionSlip(null),
                      ),
                    ],
                  ),
                ),
              ] else ...[
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => _pickImage(ImageSource.camera),
                        icon: const Icon(LucideIcons.camera, size: 14),
                        label: const Text('Take Photo', style: TextStyle(fontSize: 11)),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => _pickImage(ImageSource.gallery),
                        icon: const Icon(LucideIcons.image, size: 14),
                        label: const Text('Upload Slip', style: TextStyle(fontSize: 11)),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                GestureDetector(
                  onTap: () => config.setSendViaWhatsAppLater(!config.sendViaWhatsAppLater),
                  child: Row(
                    children: [
                      Icon(
                        config.sendViaWhatsAppLater ? LucideIcons.checkSquare : LucideIcons.square,
                        size: 16,
                        color: config.sendViaWhatsAppLater ? AppColors.primary : AppColors.slate400,
                      ),
                      const SizedBox(width: 8),
                      const Expanded(
                        child: Text(
                          'I will send my doctor slip via WhatsApp after placing the order',
                          style: TextStyle(fontSize: 11, color: AppColors.slate700, fontWeight: FontWeight.w500),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
        const SizedBox(height: 16),

        // 2. Optional Manual Power Expansion
        GestureDetector(
          onTap: () => setState(() => _showManualPowers = !_showManualPowers),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: AppColors.slate50,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.slate200),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Row(
                  children: [
                    Icon(LucideIcons.edit3, size: 15, color: AppColors.slate600),
                    SizedBox(width: 8),
                    Text(
                      'Enter Eye Numbers Manually (Optional)',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.slate800),
                    ),
                  ],
                ),
                Icon(
                  _showManualPowers ? LucideIcons.chevronUp : LucideIcons.chevronDown,
                  size: 16,
                  color: AppColors.slate500,
                ),
              ],
            ),
          ),
        ),

        if (_showManualPowers) ...[
          const SizedBox(height: 12),
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
                const Text('Right Eye (OD)', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.primaryDark)),
                const SizedBox(height: 6),
                Row(
                  children: [
                    Expanded(child: _buildSmallField('SPH', _odSphCtrl, '0.00')),
                    const SizedBox(width: 8),
                    Expanded(child: _buildSmallField('CYL', _odCylCtrl, '-0.50')),
                    const SizedBox(width: 8),
                    Expanded(child: _buildSmallField('AXIS', _odAxisCtrl, '180')),
                  ],
                ),
                const SizedBox(height: 12),
                const Text('Left Eye (OS)', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.primaryDark)),
                const SizedBox(height: 6),
                Row(
                  children: [
                    Expanded(child: _buildSmallField('SPH', _osSphCtrl, '0.00')),
                    const SizedBox(width: 8),
                    Expanded(child: _buildSmallField('CYL', _osCylCtrl, '-0.50')),
                    const SizedBox(width: 8),
                    Expanded(child: _buildSmallField('AXIS', _osAxisCtrl, '180')),
                  ],
                ),
                const SizedBox(height: 12),
                _buildSmallField('Pupillary Distance (PD mm)', _pdCtrl, '63.0'),
              ],
            ),
          ),
        ],
        const SizedBox(height: 20),

        // 3. Final Cost Breakdown Card
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.slate50,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.slate200),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Price Summary',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: AppColors.slate900),
              ),
              const SizedBox(height: 10),
              _buildSummaryRow(product.name, 'Rs. ${product.price.round()}'),
              const SizedBox(height: 6),
              _buildSummaryRow(
                selectedLens.title,
                selectedLens.getPrice(isPresbyopia) == 0
                    ? 'Included (Rs. 0)'
                    : '+Rs. ${selectedLens.getPrice(isPresbyopia).round()}',
                color: AppColors.primary,
              ),
              const Divider(height: 20, color: AppColors.slate200),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Total Frame & Lenses:',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.slate900),
                  ),
                  PriceTag(price: config.totalPrice, fontSize: 18, color: AppColors.primary),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),

        // Buttons
        Row(
          children: [
            Expanded(
              flex: 1,
              child: BrandButton(
                label: 'Back',
                variant: BrandButtonVariant.outline,
                onPressed: widget.onBack,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              flex: 2,
              child: BrandButton(
                label: 'Add to Cart',
                icon: LucideIcons.shoppingBag,
                onPressed: _saveAndAddToCart,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildSummaryRow(String label, String value, {Color? color}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(fontSize: 12, color: AppColors.slate600),
          ),
        ),
        Text(
          value,
          style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: color ?? AppColors.slate900),
        ),
      ],
    );
  }

  Widget _buildSmallField(String label, TextEditingController controller, String hint) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: AppColors.slate500)),
        const SizedBox(height: 2),
        TextFormField(
          controller: controller,
          keyboardType: const TextInputType.numberWithOptions(decimal: true, signed: true),
          style: const TextStyle(fontSize: 12),
          decoration: InputDecoration(
            hintText: hint,
            contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
          ),
        ),
      ],
    );
  }
}
