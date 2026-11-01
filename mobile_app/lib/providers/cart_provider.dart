import 'package:flutter/foundation.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/cart_item.dart';
import '../models/product.dart';
import '../models/prescription.dart';

class CartProvider extends ChangeNotifier {
  final List<CartItem> _items = [];
  static const String studioWhatsAppNumber = '+923390103262';

  String? _couponCode;
  double _discountPercentage = 0.0;
  String? _couponError;

  List<CartItem> get items => List.unmodifiable(_items);
  int get itemCount => _items.fold(0, (sum, item) => sum + item.quantity);

  double get subtotal => _items.fold(0.0, (sum, item) => sum + item.totalLinePrice);

  String? get couponCode => _couponCode;
  String? get couponError => _couponError;
  double get discountAmount => (subtotal * _discountPercentage);

  // Free shipping on orders over Rs. 3000 or with FREESHIP coupon
  double get shippingFee {
    if (_items.isEmpty) return 0.0;
    if (_couponCode == 'FREESHIP') return 0.0;
    if (subtotal >= 3000) return 0.0;
    return 250.0; // Flat 250 PKR Delivery anywhere in Pakistan
  }

  double get total => (subtotal - discountAmount + shippingFee).clamp(0.0, double.infinity);

  bool get isFreeShipping => shippingFee == 0.0 && _items.isNotEmpty;

  String get formattedSubtotal => _formatPrice(subtotal);
  String get formattedDiscount => _formatPrice(discountAmount);
  String get formattedShipping => shippingFee == 0.0 ? 'FREE' : 'Rs. ${shippingFee.round()}';
  String get formattedTotal => _formatPrice(total);

  static String _formatPrice(double amount) {
    final rounded = amount.round();
    final formatted = rounded.toString().replaceAllMapped(
          RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
          (Match m) => '${m[1]},',
        );
    return 'Rs. $formatted';
  }

  bool applyCoupon(String rawCode) {
    final code = rawCode.trim().toUpperCase();
    _couponError = null;

    if (code == 'MYEYES10' || code == 'WELCOME10') {
      _couponCode = code;
      _discountPercentage = 0.10;
      notifyListeners();
      return true;
    } else if (code == 'MYEYES20' || code == 'SAVE20') {
      _couponCode = code;
      _discountPercentage = 0.20;
      notifyListeners();
      return true;
    } else if (code == 'FREESHIP') {
      _couponCode = code;
      _discountPercentage = 0.0;
      notifyListeners();
      return true;
    } else {
      _couponError = 'Invalid coupon code. Try MYEYES10 or FREESHIP';
      notifyListeners();
      return false;
    }
  }

  void removeCoupon() {
    _couponCode = null;
    _discountPercentage = 0.0;
    _couponError = null;
    notifyListeners();
  }

  void addItem({
    required Product product,
    String? selectedColor,
    String? lensPackageId,
    String? lensPackageName,
    double lensPackagePrice = 0.0,
    Prescription? prescription,
  }) {
    final existingIndex = _items.indexWhere(
      (item) =>
          item.productId == product.id &&
          item.selectedColor == selectedColor &&
          item.lensPackageId == lensPackageId,
    );

    if (existingIndex != -1) {
      _items[existingIndex].quantity += 1;
    } else {
      _items.add(
        CartItem(
          id: '${product.id}_${DateTime.now().millisecondsSinceEpoch}',
          productId: product.id,
          name: product.name,
          price: product.price,
          image: product.firstImage,
          quantity: 1,
          selectedColor: selectedColor,
          lensPackageId: lensPackageId,
          lensPackageName: lensPackageName,
          lensPackagePrice: lensPackagePrice,
          prescription: prescription,
        ),
      );
    }
    notifyListeners();
  }

  void addConfiguredItem(CartItem item) {
    _items.add(item);
    notifyListeners();
  }

  void updateQuantity(String id, int quantity) {
    final index = _items.indexWhere((item) => item.id == id);
    if (index != -1) {
      if (quantity <= 0) {
        _items.removeAt(index);
      } else {
        _items[index].quantity = quantity;
      }
      notifyListeners();
    }
  }

  void removeItem(String id) {
    _items.removeWhere((item) => item.id == id);
    notifyListeners();
  }

  void clearCart() {
    _items.clear();
    _couponCode = null;
    _discountPercentage = 0.0;
    _couponError = null;
    notifyListeners();
  }

  /// Builds structured WhatsApp order checkout payload and opens WhatsApp directly
  Future<bool> checkoutViaWhatsApp({
    required String customerName,
    required String customerPhone,
    String? shippingAddress,
    String? city,
    String? paymentMethod = 'Cash on Delivery (COD)',
  }) async {
    if (_items.isEmpty) return false;

    final orderId = 'MYEYES-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}';

    final buffer = StringBuffer();
    buffer.writeln('👓 *NEW PRESCRIPTION ORDER — MY EYES OPTICAL LAB*');
    buffer.writeln('📋 *Order Ref:* #$orderId');
    buffer.writeln('──────────────────────────────');
    buffer.writeln('👤 *Customer:* $customerName');
    buffer.writeln('📱 *Phone:* $customerPhone');
    if (shippingAddress != null && shippingAddress.isNotEmpty) {
      buffer.writeln('📍 *Address:* $shippingAddress, ${city ?? ""}');
    }
    buffer.writeln('💳 *Payment:* $paymentMethod');
    buffer.writeln('──────────────────────────────');
    buffer.writeln('🛍️ *ORDER ITEMS:*');

    for (int i = 0; i < _items.length; i++) {
      final item = _items[i];
      buffer.writeln('\n*#${i + 1}. ${item.name}* (x${item.quantity})');
      buffer.writeln('   • Frame Price: Rs. ${item.price.round()}');
      if (item.selectedColor != null) {
        buffer.writeln('   • Color: ${item.selectedColor}');
      }
      if (item.lensPackageName != null) {
        buffer.writeln('   • Lens: ${item.lensPackageName} (+Rs. ${item.lensPackagePrice.round()})');
      }

      if (item.prescription != null) {
        final rx = item.prescription!;
        buffer.writeln('   • Prescription Type: ${rx.lensTypeLabel}');
        buffer.writeln('   • Right Eye (OD): SPH ${rx.odSph > 0 ? "+" : ""}${rx.odSph.toStringAsFixed(2)}${rx.odCyl != null ? " | CYL ${rx.odCyl!.toStringAsFixed(2)} AXIS ${rx.odAxis ?? 0}°" : ""}');
        buffer.writeln('   • Left Eye (OS): SPH ${rx.osSph > 0 ? "+" : ""}${rx.osSph.toStringAsFixed(2)}${rx.osCyl != null ? " | CYL ${rx.osCyl!.toStringAsFixed(2)} AXIS ${rx.osAxis ?? 0}°" : ""}');
        buffer.writeln('   • Pupillary Distance (PD): ${rx.pd} mm');
        if (rx.addPower != null) {
          buffer.writeln('   • Reading ADD: +${rx.addPower!.toStringAsFixed(2)}');
        }
      } else {
        buffer.writeln('   • Prescription: Will share doctor slip via WhatsApp');
      }
      buffer.writeln('   • Item Total: ${item.formattedTotalPrice}');
    }

    buffer.writeln('\n──────────────────────────────');
    buffer.writeln('💵 *Subtotal:* $formattedSubtotal');
    if (_couponCode != null) {
      buffer.writeln('🏷️ *Coupon ($_couponCode):* -$formattedDiscount');
    }
    buffer.writeln('🚚 *Delivery Fee:* $formattedShipping');
    buffer.writeln('💰 *Total Payable:* $formattedTotal');
    buffer.writeln('──────────────────────────────');
    buffer.writeln('Please confirm my optical order and schedule lab glazing & dispatch.');

    final cleanNumber = studioWhatsAppNumber.replaceAll(RegExp(r'[^\d]'), '');
    final encodedText = Uri.encodeComponent(buffer.toString());
    final whatsappUri = Uri.parse('https://wa.me/$cleanNumber?text=$encodedText');

    try {
      if (await canLaunchUrl(whatsappUri)) {
        await launchUrl(whatsappUri, mode: LaunchMode.externalApplication);
        return true;
      } else {
        return false;
      }
    } catch (_) {
      return false;
    }
  }
}
