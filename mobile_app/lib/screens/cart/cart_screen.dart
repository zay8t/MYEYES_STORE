import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../theme.dart';
import '../../providers/cart_provider.dart';
import '../../providers/configurator_provider.dart';
import '../../widgets/common/brand_button.dart';
import '../../widgets/common/price_tag.dart';
import 'widgets/cart_item_tile.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _addressController = TextEditingController();
  final TextEditingController _cityController = TextEditingController(text: 'Karachi');

  @override
  void initState() {
    super.initState();
    final config = context.read<ConfiguratorProvider>();
    _nameController.text = config.customerName;
    _phoneController.text = config.customerPhone;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _cityController.dispose();
    super.dispose();
  }

  void _triggerWhatsAppCheckout() {
    final cart = context.read<CartProvider>();
    final config = context.read<ConfiguratorProvider>();

    String name = _nameController.text.trim();
    String phone = _phoneController.text.trim();

    if (name.isEmpty) name = config.customerName.isNotEmpty ? config.customerName : 'Valued Customer';
    if (phone.isEmpty) phone = config.customerPhone.isNotEmpty ? config.customerPhone : 'Provided on WhatsApp';

    cart.checkoutViaWhatsApp(
      customerName: name,
      customerPhone: phone,
      shippingAddress: _addressController.text.trim(),
      city: _cityController.text.trim(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final cart = context.watch<CartProvider>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Shopping Bag'),
        actions: [
          if (cart.items.isNotEmpty)
            TextButton(
              onPressed: cart.clearCart,
              child: const Text('Clear', style: TextStyle(color: AppColors.error, fontWeight: FontWeight.bold)),
            ),
        ],
      ),
      body: cart.items.isEmpty
          ? Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      width: 80,
                      height: 80,
                      decoration: const BoxDecoration(
                        color: AppColors.slate100,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(LucideIcons.shoppingBag, size: 36, color: AppColors.slate400),
                    ),
                    const SizedBox(height: 20),
                    const Text(
                      'Your Bag is Empty',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppColors.slate900),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Add your favorite prescription glasses and customize lenses to get started.',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 13, color: AppColors.slate500, height: 1.4),
                    ),
                  ],
                ),
              ),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Items List
                  ListView.separated(
                    physics: const NeverScrollableScrollPhysics(),
                    shrinkWrap: true,
                    itemCount: cart.items.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final item = cart.items[index];
                      return CartItemTile(
                        item: item,
                        onQuantityChanged: (qty) => cart.updateQuantity(item.id, qty),
                        onRemove: () => cart.removeItem(item.id),
                      );
                    },
                  ),
                  const SizedBox(height: 24),

                  // Quick Shipping Details Card
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
                            Icon(LucideIcons.mapPin, size: 16, color: AppColors.primary),
                            SizedBox(width: 8),
                            Text(
                              'Delivery Information',
                              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: AppColors.slate900),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        TextField(
                          controller: _nameController,
                          decoration: const InputDecoration(
                            hintText: 'Recipient Full Name',
                            contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          ),
                        ),
                        const SizedBox(height: 10),
                        TextField(
                          controller: _phoneController,
                          keyboardType: TextInputType.phone,
                          decoration: const InputDecoration(
                            hintText: 'WhatsApp Contact Number',
                            contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          ),
                        ),
                        const SizedBox(height: 10),
                        TextField(
                          controller: _addressController,
                          decoration: const InputDecoration(
                            hintText: 'Street Address & House / Flat #',
                            contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          ),
                        ),
                        const SizedBox(height: 10),
                        TextField(
                          controller: _cityController,
                          decoration: const InputDecoration(
                            hintText: 'City (e.g. Karachi, Lahore, Islamabad)',
                            contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Order Summary Card
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
                          'Payment & Order Summary',
                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: AppColors.slate900),
                        ),
                        const SizedBox(height: 12),
                        _buildSummaryLine('Subtotal (${cart.itemCount} items)', cart.formattedSubtotal),
                        const SizedBox(height: 6),
                        _buildSummaryLine('Delivery Anywhere in Pakistan', 'Rs. 250 (Flat)'),
                        const Divider(height: 20, color: AppColors.slate200),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Total Amount Payable:',
                              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: AppColors.slate900),
                            ),
                            PriceTag(price: cart.total, fontSize: 18, color: AppColors.primary),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 100), // Bottom padding for sticky button
                ],
              ),
            ),
      bottomNavigationBar: cart.items.isEmpty
          ? null
          : Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                border: const Border(top: BorderSide(color: AppColors.slate200)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.04),
                    blurRadius: 10,
                    offset: const Offset(0, -4),
                  ),
                ],
              ),
              child: SafeArea(
                child: BrandButton(
                  label: 'Order via WhatsApp (${cart.formattedTotal})',
                  icon: LucideIcons.messageSquare,
                  onPressed: _triggerWhatsAppCheckout,
                ),
              ),
            ),
    );
  }

  Widget _buildSummaryLine(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(fontSize: 12, color: AppColors.slate600)),
        Text(value, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.slate900)),
      ],
    );
  }
}
