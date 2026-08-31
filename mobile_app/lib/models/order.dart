import 'prescription.dart';

enum OrderStatus {
  pending,
  processing,
  shipped,
  delivered,
  orderPlaced,
  advancePending,
  advanceVerified,
  labQueued,
  lensSurfacingEdging,
  qualityInspectionPassed,
  dispatchedWithCourier,
  cancelled,
}

enum PaymentStatus {
  unpaid,
  pendingVerification,
  paid,
  failed,
  refunded,
}

enum PaymentMethod {
  cod,
  bankTransfer,
  easypaisa,
  jazzcash,
  raast,
}

class OrderItem {
  final String id;
  final String productId;
  final String productName;
  final double price;
  final int quantity;
  final String? productImage;
  final Prescription? prescription;

  OrderItem({
    required this.id,
    required this.productId,
    required this.productName,
    required this.price,
    required this.quantity,
    this.productImage,
    this.prescription,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    return OrderItem(
      id: json['id']?.toString() ?? '',
      productId: json['productId']?.toString() ?? '',
      productName: json['product'] != null && json['product']['name'] != null
          ? json['product']['name'].toString()
          : json['productName']?.toString() ?? 'Eyewear Frame',
      price: (json['price'] is num) ? (json['price'] as num).toDouble() : double.tryParse(json['price']?.toString() ?? '0') ?? 0.0,
      quantity: (json['quantity'] is num) ? (json['quantity'] as num).toInt() : int.tryParse(json['quantity']?.toString() ?? '1') ?? 1,
      productImage: json['product'] != null && json['product']['image_url'] != null
          ? json['product']['image_url'].toString()
          : null,
      prescription: json['prescription'] != null && json['prescription'] is Map<String, dynamic>
          ? Prescription.fromJson(json['prescription'] as Map<String, dynamic>)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'productId': productId,
      'productName': productName,
      'price': price,
      'quantity': quantity,
      if (productImage != null) 'productImage': productImage,
      if (prescription != null) 'prescription': prescription!.toJson(),
    };
  }
}

class Order {
  final String id;
  final String? orderNumber;
  final String customerName;
  final String customerEmail;
  final String? customerPhone;
  final String? shippingAddress;
  final String? shippingCity;
  final String paymentMethod;
  final String paymentStatus;
  final String status;
  final double totalAmount;
  final double shippingFee;
  final DateTime createdAt;
  final List<OrderItem> items;
  final String? trackingId;

  Order({
    required this.id,
    this.orderNumber,
    required this.customerName,
    required this.customerEmail,
    this.customerPhone,
    this.shippingAddress,
    this.shippingCity,
    required this.paymentMethod,
    required this.paymentStatus,
    required this.status,
    required this.totalAmount,
    this.shippingFee = 250.0,
    required this.createdAt,
    required this.items,
    this.trackingId,
  });

  String get formattedTotal {
    final rounded = totalAmount.round();
    final formatted = rounded.toString().replaceAllMapped(
          RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
          (Match m) => '${m[1]},',
        );
    return 'Rs. $formatted';
  }

  String get statusDisplayLabel {
    switch (status.toUpperCase()) {
      case 'ORDER_PLACED':
      case 'PENDING':
        return 'Order Placed';
      case 'ADVANCE_PENDING':
        return 'Advance Verification Pending';
      case 'ADVANCE_VERIFIED':
      case 'PROCESSING':
        return 'Payment Verified';
      case 'LAB_QUEUED':
        return 'Queued at Optical Lab';
      case 'LENS_SURFACING_EDGING':
        return 'Lenses Being Cut & Polished';
      case 'QUALITY_INSPECTION_PASSED':
        return 'Quality Inspection Passed';
      case 'DISPATCHED_WITH_COURIER':
      case 'SHIPPED':
        return 'Dispatched with Courier';
      case 'DELIVERED':
        return 'Delivered';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return 'Processing';
    }
  }

  factory Order.fromJson(Map<String, dynamic> json) {
    var rawItems = json['items'];
    List<OrderItem> itemsList = [];
    if (rawItems is List) {
      itemsList = rawItems.map((e) => OrderItem.fromJson(e as Map<String, dynamic>)).toList();
    }

    return Order(
      id: json['id']?.toString() ?? '',
      orderNumber: json['orderNumber']?.toString(),
      customerName: json['customerName']?.toString() ?? '',
      customerEmail: json['customerEmail']?.toString() ?? '',
      customerPhone: json['customerPhone']?.toString(),
      shippingAddress: json['shippingAddress']?.toString(),
      shippingCity: json['shippingCity']?.toString(),
      paymentMethod: json['paymentMethod']?.toString() ?? 'BANK_TRANSFER',
      paymentStatus: json['paymentStatus']?.toString() ?? 'PENDING_VERIFICATION',
      status: json['status']?.toString() ?? 'PROCESSING',
      totalAmount: (json['totalAmount'] is num) ? (json['totalAmount'] as num).toDouble() : double.tryParse(json['totalAmount']?.toString() ?? '0') ?? 0.0,
      shippingFee: (json['shippingFee'] is num) ? (json['shippingFee'] as num).toDouble() : double.tryParse(json['shippingFee']?.toString() ?? '250') ?? 250.0,
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now() : DateTime.now(),
      items: itemsList,
      trackingId: json['transactionId']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      if (orderNumber != null) 'orderNumber': orderNumber,
      'customerName': customerName,
      'customerEmail': customerEmail,
      if (customerPhone != null) 'customerPhone': customerPhone,
      if (shippingAddress != null) 'shippingAddress': shippingAddress,
      if (shippingCity != null) 'shippingCity': shippingCity,
      'paymentMethod': paymentMethod,
      'paymentStatus': paymentStatus,
      'status': status,
      'totalAmount': totalAmount,
      'shippingFee': shippingFee,
      'createdAt': createdAt.toIso8601String(),
      'items': items.map((e) => e.toJson()).toList(),
    };
  }
}
