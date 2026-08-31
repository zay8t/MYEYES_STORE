import 'dart:convert';

enum FrameShape {
  nill,
  wayfarer,
  aviator,
  rectangle,
  round,
  oval,
  square,
  catEye,
  geometric,
  rimless,
  semiRimless,
}

enum MaterialType {
  nill,
  acetate,
  metal,
  titanium,
  tr90,
  stainlessSteel,
  wood,
  hybrid,
}

enum ProductCategory {
  nill,
  eyeglasses,
  sunglasses,
  contactLenses,
  accessories,
}

class Product {
  final String id;
  final String name;
  final String slug;
  final String description;
  final double price;
  final int stock;
  final String frameShape;
  final String material;
  final String gender;
  final List<String> colors;
  final List<String> images;
  final String category;
  final bool featured;
  final DateTime createdAt;
  final String? modelGlbUrl;

  Product({
    required this.id,
    required this.name,
    required this.slug,
    required this.description,
    required this.price,
    required this.stock,
    required this.frameShape,
    required this.material,
    required this.gender,
    required this.colors,
    required this.images,
    required this.category,
    required this.featured,
    required this.createdAt,
    this.modelGlbUrl,
  });

  /// Formats price in PKR currency (e.g. "Rs. 2,450")
  String get formattedPrice {
    final rounded = price.round();
    final formatted = rounded.toString().replaceAllMapped(
          RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
          (Match m) => '${m[1]},',
        );
    return 'Rs. $formatted';
  }

  /// Returns primary display image or a placeholder
  String get firstImage {
    if (images.isNotEmpty && images[0].isNotEmpty && images[0] != '/logo.png') {
      return images[0];
    }
    return 'https://placehold.co/600x400/f8fafc/0f172a?text=Eyewear+Frame';
  }

  /// Human-friendly display string for frame shape
  String get formattedShape {
    switch (frameShape.toUpperCase()) {
      case 'WAYFARER':
        return 'Wayfarer';
      case 'AVIATOR':
        return 'Aviator';
      case 'RECTANGLE':
        return 'Rectangle';
      case 'ROUND':
        return 'Round';
      case 'OVAL':
        return 'Oval';
      case 'SQUARE':
        return 'Square';
      case 'CAT_EYE':
        return 'Cat-Eye';
      case 'GEOMETRIC':
        return 'Geometric';
      case 'RIMLESS':
        return 'Rimless';
      case 'SEMI_RIMLESS':
        return 'Semi-Rimless';
      default:
        return 'Classic';
    }
  }

  /// Human-friendly display string for material
  String get formattedMaterial {
    switch (material.toUpperCase()) {
      case 'TITANIUM':
        return 'Japanese Titanium';
      case 'ACETATE':
        return 'Bio-Acetate';
      case 'TR90':
        return 'Flexible TR-90';
      case 'METAL':
        return 'Premium Metal';
      case 'STAINLESS_STEEL':
        return 'Stainless Steel';
      case 'WOOD':
        return 'Natural Wood';
      case 'HYBRID':
        return 'Hybrid Alloy';
      default:
        return 'Standard Alloy';
    }
  }

  static List<String> parseImagesList(dynamic imagesData) {
    if (imagesData == null) return [];
    if (imagesData is List) {
      return imagesData.map((e) => e.toString().trim()).where((e) => e.isNotEmpty).toList();
    }
    if (imagesData is String) {
      final trimmed = imagesData.trim();
      if (trimmed.startsWith('[')) {
        try {
          final parsed = jsonDecode(trimmed);
          if (parsed is List) {
            return parsed.map((e) => e.toString().trim()).where((e) => e.isNotEmpty).toList();
          }
        } catch (_) {}
      }
      return trimmed.split(',').map((s) => s.trim()).where((s) => s.isNotEmpty).toList();
    }
    return [];
  }

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Standard Eyewear Frame',
      slug: json['slug']?.toString() ?? 'eyewear-frame',
      description: json['description']?.toString() ?? '',
      price: (json['price'] is num) ? (json['price'] as num).toDouble() : double.tryParse(json['price']?.toString() ?? '0') ?? 0.0,
      stock: (json['stock'] is num) ? (json['stock'] as num).toInt() : int.tryParse(json['stock']?.toString() ?? '0') ?? 0,
      frameShape: json['frameShape']?.toString() ?? 'NILL',
      material: json['material']?.toString() ?? 'NILL',
      gender: json['gender']?.toString() ?? 'Unisex',
      colors: (json['colors'] is List)
          ? (json['colors'] as List).map((e) => e.toString()).toList()
          : (json['colors'] is String)
              ? [json['colors'].toString()]
              : [],
      images: parseImagesList(json['images']),
      category: json['category']?.toString() ?? 'EYEGLASSES',
      featured: json['featured'] == true,
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now() : DateTime.now(),
      modelGlbUrl: json['modelGlbUrl']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'slug': slug,
      'description': description,
      'price': price,
      'stock': stock,
      'frameShape': frameShape,
      'material': material,
      'gender': gender,
      'colors': colors,
      'images': images,
      'category': category,
      'featured': featured,
      'createdAt': createdAt.toIso8601String(),
      if (modelGlbUrl != null) 'modelGlbUrl': modelGlbUrl,
    };
  }
}
