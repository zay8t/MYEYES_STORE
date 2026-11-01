import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../theme.dart';
import '../../widgets/common/brand_button.dart';

class OrderTrackingScreen extends StatefulWidget {
  const OrderTrackingScreen({super.key});

  @override
  State<OrderTrackingScreen> createState() => _OrderTrackingScreenState();
}

class _OrderTrackingScreenState extends State<OrderTrackingScreen> {
  final TextEditingController _orderIdController = TextEditingController(text: 'MYEYES-8821');
  bool _hasSearched = true;

  @override
  void dispose() {
    _orderIdController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.slate50,
      appBar: AppBar(
        title: const Text('Track Optical Order'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Search Box Card
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.slate200),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Track Prescription Status',
                    style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: AppColors.slate900),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Enter your MY EYES Order Reference (e.g. MYEYES-8821) or WhatsApp Phone Number.',
                    style: TextStyle(fontSize: 12, color: AppColors.slate500),
                  ),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _orderIdController,
                          decoration: const InputDecoration(
                            hintText: 'Order ID or Phone #',
                            prefixIcon: Icon(LucideIcons.search, size: 18),
                            contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.slate900,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
                        ),
                        onPressed: () => setState(() => _hasSearched = true),
                        child: const Text('Track', style: TextStyle(fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            if (_hasSearched) ...[
              // Order Summary Card
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppColors.slate200),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _orderIdController.text.trim().toUpperCase(),
                              style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: AppColors.slate900),
                            ),
                            const Text('Placed on Nov 01, 2026 • Cash on Delivery', style: TextStyle(fontSize: 11, color: AppColors.slate500)),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            color: AppColors.primarySubtle,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: AppColors.primary.withOpacity(0.4)),
                          ),
                          child: const Text(
                            'IN LAB GLAZING',
                            style: TextStyle(color: AppColors.primaryDark, fontSize: 10, fontWeight: FontWeight.w800),
                          ),
                        ),
                      ],
                    ),
                    const Divider(height: 24, color: AppColors.slate100),

                    // Tracking Timeline
                    const Text('Laboratory & Dispatch Timeline', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                    const SizedBox(height: 16),
                    _buildTimelineStep(
                      title: 'Order Confirmed & Logged',
                      desc: 'Nov 01, 2:15 PM • Received in MY EYES Optical Lab queue',
                      isCompleted: true,
                      isCurrent: false,
                    ),
                    _buildTimelineStep(
                      title: 'Doctor Slip Verified by Optometrist',
                      desc: 'Nov 01, 3:30 PM • Power Verified (OD SPH -1.50 / OS SPH -1.75 PD 63mm)',
                      isCompleted: true,
                      isCurrent: false,
                    ),
                    _buildTimelineStep(
                      title: 'Lens Glazing & Surface Coating',
                      desc: 'Currently in progress • Applying Blue Cut Anti-Reflective Shield',
                      isCompleted: false,
                      isCurrent: true,
                    ),
                    _buildTimelineStep(
                      title: 'Digital Lensometer Quality Inspection',
                      desc: 'Pending optical tolerance certification',
                      isCompleted: false,
                      isCurrent: false,
                    ),
                    _buildTimelineStep(
                      title: 'Courier Express Dispatch',
                      desc: 'Estimated Delivery in 2-3 business days across Pakistan',
                      isCompleted: false,
                      isCurrent: false,
                      isLast: true,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Digital Laboratory Prescription Slip (A4 Receipt style)
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppColors.slate300),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.04),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('MY EYES OPTICAL LAB', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15, letterSpacing: 0.5)),
                            Text('Certified Prescription Laboratory Slip', style: TextStyle(fontSize: 10, color: AppColors.slate500)),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.all(6),
                          decoration: const BoxDecoration(
                            color: AppColors.slate100,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(LucideIcons.glasses, size: 18, color: AppColors.slate800),
                        ),
                      ],
                    ),
                    const Divider(height: 20, color: AppColors.slate200),

                    // Patient Specs
                    const Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Patient: Valued Customer', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                        Text('Karachi, Pakistan', style: TextStyle(fontSize: 12, color: AppColors.slate600)),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // Optical Power Table
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.slate50,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: AppColors.slate200),
                      ),
                      child: const Column(
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('Eye', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: AppColors.slate400)),
                              Text('SPH', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: AppColors.slate400)),
                              Text('CYL', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: AppColors.slate400)),
                              Text('AXIS', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: AppColors.slate400)),
                              Text('PD', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: AppColors.slate400)),
                            ],
                          ),
                          Divider(height: 12, color: AppColors.slate200),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('Right (OD)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
                              Text('-1.50', style: TextStyle(fontSize: 11)),
                              Text('-0.50', style: TextStyle(fontSize: 11)),
                              Text('90°', style: TextStyle(fontSize: 11)),
                              Text('31.5', style: TextStyle(fontSize: 11)),
                            ],
                          ),
                          SizedBox(height: 6),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('Left (OS)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
                              Text('-1.75', style: TextStyle(fontSize: 11)),
                              Text('-0.50', style: TextStyle(fontSize: 11)),
                              Text('85°', style: TextStyle(fontSize: 11)),
                              Text('31.5', style: TextStyle(fontSize: 11)),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Frame & Coating Summary
                    const Text('Frame: The Karachi Minimalist Oval (Matte Black)', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                    const Text('Lens: Blue Light Cut Anti-Glare Package (Index 1.56)', style: TextStyle(fontSize: 11, color: AppColors.primaryDark)),
                    const Divider(height: 20, color: AppColors.slate200),

                    // Financials
                    const Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Total Amount (COD):', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13)),
                        Text('Rs. 3,300', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15, color: AppColors.primary)),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // WhatsApp Help Button
              BrandButton(
                label: 'Inquire with Lab on WhatsApp',
                icon: LucideIcons.messageCircle,
                onPressed: () async {
                  final text = 'Hello MY EYES Lab, I want to check the status of my order ${_orderIdController.text}';
                  final uri = Uri.parse('https://wa.me/923390103262?text=${Uri.encodeComponent(text)}');
                  if (await canLaunchUrl(uri)) {
                    await launchUrl(uri, mode: LaunchMode.externalApplication);
                  }
                },
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildTimelineStep({
    required String title,
    required String desc,
    required bool isCompleted,
    required bool isCurrent,
    bool isLast = false,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Column(
          children: [
            Container(
              width: 22,
              height: 22,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isCompleted
                    ? AppColors.primary
                    : (isCurrent ? AppColors.primary : AppColors.slate200),
              ),
              child: Center(
                child: isCompleted
                    ? const Icon(LucideIcons.check, size: 12, color: Colors.white)
                    : (isCurrent
                        ? const Icon(LucideIcons.clock, size: 12, color: Colors.white)
                        : null),
              ),
            ),
            if (!isLast)
              Container(
                width: 2,
                height: 36,
                color: isCompleted ? AppColors.primary : AppColors.slate200,
              ),
          ],
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 12,
                  color: isCurrent ? AppColors.primaryDark : AppColors.slate900,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                desc,
                style: TextStyle(
                  fontSize: 11,
                  color: isCurrent ? AppColors.slate700 : AppColors.slate500,
                  height: 1.3,
                ),
              ),
              const SizedBox(height: 14),
            ],
          ),
        ),
      ],
    );
  }
}
