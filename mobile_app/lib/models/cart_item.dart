import 'prescription.dart';

class CartItem {
  final String id;
  final String productId;
  final String name;
  final double price;
  final String image;
  int quantity;
  final String? selectedColor;
  final String? lensPackageId;
  final String? lensPackageName;
  final double lensPackagePrice;
  final Prescription? prescription;

  CartItem({
    required this.id,
    required this.productId,
    required this.name,
    required this.price,
    required this.image,
    this.quantity = 1,
    this.selectedColor,
    this.lensPackageId,
    this.lensPackageName,
    this.lensPackagePrice = 0.0,
    this.prescription,
  });

  /// Total unit price (frame + selected prescription lenses)
  double get unitPrice => price + lensPackagePrice;

  /// Total line price (unitPrice * quantity)
  double get totalLinePrice => unitPrice * quantity;

  String get formattedTotalPrice {
    final rounded = totalLinePrice.round();
    final formatted = rounded.toString().replaceAllMapped(
          RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
          (Match m) => '${m[1]},',
        );
    return 'Rs. $formatted';
  }

  factory CartItem.fromJson(Map<String, dynamic> json) {
    return CartItem(
      id: json['id']?.toString() ?? DateTime.now().millisecondsSinceEpoch.toString(),
      productId: json['productId']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Eyewear Frame',
      price: (json['price'] is num) ? (json['price'] as num).toDouble() : double.tryParse(json['price']?.toString() ?? '0') ?? 0.0,
      image: json['image']?.toString() ?? '',
      quantity: (json['quantity'] is num) ? (json['quantity'] as num).toInt() : int.tryParse(json['quantity']?.toString() ?? '1') ?? 1,
      selectedColor: json['selectedColor']?.toString(),
      lensPackageId: json['lensPackageId']?.toString(),
      lensPackageName: json['lensPackageName']?.toString(),
      lensPackagePrice: (json['lensPackagePrice'] is num) ? (json['lensPackagePrice'] as num).toDouble() : double.tryParse(json['lensPackagePrice']?.toString() ?? '0') ?? 0.0,
      prescription: json['prescription'] != null && json['prescription'] is Map<String, dynamic>
          ? Prescription.fromJson(json['prescription'] as Map<String, dynamic>)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'productId': productId,
      'name': name,
      'price': price,
      'image': image,
      'quantity': quantity,
      if (selectedColor != null) 'selectedColor': selectedColor,
      if (lensPackageId != null) 'lensPackageId': lensPackageId,
      if (lensPackageName != null) 'lensPackageName': lensPackageName,
      'lensPackagePrice': lensPackagePrice,
      if (prescription != null) 'prescription': prescription!.toJson(),
    };
  }
}
