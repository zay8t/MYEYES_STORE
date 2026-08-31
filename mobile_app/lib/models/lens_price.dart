class LensPrice {
  final String id;
  final String category; // "SINGLE_VISION", "BIFOCAL", "PROGRESSIVE"
  final String name;     // "Anti-Glare Standard", "Blue Light Shield", "Photogray Transition"
  final double price;
  final double pricePlus40;
  final String? description;
  final String? index;   // "1.56", "1.61", "1.67"
  final bool isPopular;

  LensPrice({
    required this.id,
    required this.category,
    required this.name,
    required this.price,
    this.pricePlus40 = 0,
    this.description,
    this.index,
    this.isPopular = false,
  });

  String get formattedPrice {
    if (price == 0) return 'Free / Included';
    final rounded = price.round();
    final formatted = rounded.toString().replaceAllMapped(
          RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
          (Match m) => '${m[1]},',
        );
    return '+Rs. $formatted';
  }

  factory LensPrice.fromJson(Map<String, dynamic> json) {
    return LensPrice(
      id: json['id']?.toString() ?? '',
      category: json['category']?.toString() ?? 'SINGLE_VISION',
      name: json['name']?.toString() ?? 'Standard Clear Lens',
      price: (json['price'] is num) ? (json['price'] as num).toDouble() : double.tryParse(json['price']?.toString() ?? '0') ?? 0.0,
      pricePlus40: (json['pricePlus40'] is num) ? (json['pricePlus40'] as num).toDouble() : double.tryParse(json['pricePlus40']?.toString() ?? '0') ?? 0.0,
      description: json['description']?.toString(),
      index: json['index']?.toString(),
      isPopular: json['isPopular'] == true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'category': category,
      'name': name,
      'price': price,
      'pricePlus40': pricePlus40,
      if (description != null) 'description': description,
      if (index != null) 'index': index,
      'isPopular': isPopular,
    };
  }
}
