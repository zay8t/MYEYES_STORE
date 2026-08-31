import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/product.dart';
import '../models/lens_price.dart';
import '../models/order.dart';

class ApiService {
  // Change baseUrl to your live domain or localhost (10.0.2.2 for Android emulator)
  static String baseUrl = 'http://10.0.2.2:3000';

  static final Map<String, String> _headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  /// Fetch all products from Next.js /api/products
  static Future<List<Product>> getProducts({String? category}) async {
    try {
      final uri = Uri.parse('$baseUrl/api/products');
      final response = await http.get(uri, headers: _headers);

      if (response.statusCode == 200) {
        final dynamic data = jsonDecode(response.body);
        if (data is List) {
          final list = data.map((json) => Product.fromJson(json as Map<String, dynamic>)).toList();
          if (category != null && category.isNotEmpty) {
            return list.where((p) => p.category.toUpperCase() == category.toUpperCase()).toList();
          }
          return list;
        }
      }
      return [];
    } catch (e) {
      // Return empty list on failure gracefully
      return [];
    }
  }

  /// Fetch single product by slug
  static Future<Product?> getProductBySlug(String slug) async {
    try {
      final uri = Uri.parse('$baseUrl/api/products/$slug');
      final response = await http.get(uri, headers: _headers);

      if (response.statusCode == 200) {
        final dynamic data = jsonDecode(response.body);
        if (data is Map<String, dynamic>) {
          return Product.fromJson(data);
        }
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  /// Fetch lens prices from Next.js /api/base-prices or /api/admin/lens-prices
  static Future<List<LensPrice>> getLensPrices() async {
    try {
      final uri = Uri.parse('$baseUrl/api/base-prices');
      final response = await http.get(uri, headers: _headers);

      if (response.statusCode == 200) {
        final dynamic data = jsonDecode(response.body);
        if (data is List) {
          return data.map((json) => LensPrice.fromJson(json as Map<String, dynamic>)).toList();
        }
      }
      return _defaultLensPrices();
    } catch (e) {
      return _defaultLensPrices();
    }
  }

  /// Submit new customer order
  static Future<Map<String, dynamic>?> submitOrder(Map<String, dynamic> orderPayload) async {
    try {
      final uri = Uri.parse('$baseUrl/api/orders');
      final response = await http.post(
        uri,
        headers: _headers,
        body: jsonEncode(orderPayload),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        return jsonDecode(response.body) as Map<String, dynamic>;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  /// Track customer order by order number or tracking ID
  static Future<Order?> trackOrder(String orderNumber) async {
    try {
      final uri = Uri.parse('$baseUrl/api/orders/$orderNumber');
      final response = await http.get(uri, headers: _headers);

      if (response.statusCode == 200) {
        final dynamic data = jsonDecode(response.body);
        if (data is Map<String, dynamic>) {
          return Order.fromJson(data);
        }
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  static List<LensPrice> _defaultLensPrices() {
    return [
      LensPrice(
        id: 'standard-sv',
        category: 'SINGLE_VISION',
        name: 'Standard Single Vision',
        price: 0,
        description: 'Anti-reflective clear lenses included with every frame.',
      ),
      LensPrice(
        id: 'blue-shield',
        category: 'SINGLE_VISION',
        name: 'Blue Light Screen Shield',
        price: 850,
        description: 'Blocks harmful blue light emitted by digital screens.',
        isPopular: true,
      ),
      LensPrice(
        id: 'photogray',
        category: 'SINGLE_VISION',
        name: 'Photochromic Transitions (Clear to Dark)',
        price: 1450,
        description: 'Adapts smoothly from crystal clear indoor to dark in sunlight.',
      ),
      LensPrice(
        id: 'polarized-sun',
        category: 'SUNGLASSES',
        name: 'Polarized Sunglasses Lens',
        price: 1200,
        description: '100% UV400 protection and glare elimination for driving.',
      ),
    ];
  }
}
