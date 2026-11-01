import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/product.dart';
import '../models/lens_price.dart';
import '../models/order.dart';

class AiStylistResponse {
  final String reply;
  final List<String> productIds;
  final List<String> suggestedQuestions;

  AiStylistResponse({
    required this.reply,
    this.productIds = const [],
    this.suggestedQuestions = const [],
  });

  factory AiStylistResponse.fromJson(Map<String, dynamic> json) {
    List<String> pIds = [];
    if (json['productIds'] is List) {
      pIds = (json['productIds'] as List).map((e) => e.toString()).toList();
    }
    List<String> sQuestions = [];
    if (json['suggestedQuestions'] is List) {
      sQuestions = (json['suggestedQuestions'] as List).map((e) => e.toString()).toList();
    }
    return AiStylistResponse(
      reply: json['reply']?.toString() ?? 'How can I assist you with your eyewear today?',
      productIds: pIds,
      suggestedQuestions: sQuestions,
    );
  }
}

class ApiService {
  // Base URL for web backend API (Use 10.0.2.2 for Android emulator, localhost for web/desktop)
  static String baseUrl = 'http://10.0.2.2:3000';

  static final Map<String, String> _headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  /// Fetch all products from Next.js /api/products
  static Future<List<Product>> getProducts({String? category}) async {
    try {
      final uri = Uri.parse('$baseUrl/api/products');
      final response = await http.get(uri, headers: _headers).timeout(const Duration(seconds: 6));

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
      return [];
    }
  }

  /// Fetch single product by slug
  static Future<Product?> getProductBySlug(String slug) async {
    try {
      final uri = Uri.parse('$baseUrl/api/products/$slug');
      final response = await http.get(uri, headers: _headers).timeout(const Duration(seconds: 6));

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

  /// Fetch lens prices from Next.js /api/base-prices
  static Future<List<LensPrice>> getLensPrices() async {
    try {
      final uri = Uri.parse('$baseUrl/api/base-prices');
      final response = await http.get(uri, headers: _headers).timeout(const Duration(seconds: 6));

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

  /// Send query to Gemini AI Optical Stylist (/api/ai-stylist) with graceful fallback
  static Future<AiStylistResponse> askAiStylist({
    required String message,
    List<Map<String, String>> history = const [],
    List<Product> catalog = const [],
  }) async {
    try {
      final uri = Uri.parse('$baseUrl/api/ai-stylist');
      final payload = {
        'message': message,
        'history': history,
        'products': catalog
            .take(20)
            .map((p) => {
                  'id': p.id,
                  'name': p.name,
                  'price': p.price,
                  'frameShape': p.frameShape,
                  'material': p.material,
                  'gender': p.gender,
                })
            .toList(),
      };

      final response = await http
          .post(uri, headers: _headers, body: jsonEncode(payload))
          .timeout(const Duration(seconds: 8));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data is Map<String, dynamic>) {
          return AiStylistResponse.fromJson(data);
        }
      }
      return _fallbackLocalAi(message, catalog);
    } catch (_) {
      return _fallbackLocalAi(message, catalog);
    }
  }

  /// Intelligent local optical styling engine when backend is offline
  static AiStylistResponse _fallbackLocalAi(String query, List<Product> catalog) {
    final q = query.toLowerCase();

    if (q.contains('round face') || q.contains('circular face')) {
      final matches = catalog.where((p) => p.frameShape.toUpperCase() == 'RECTANGLE' || p.frameShape.toUpperCase() == 'SQUARE' || p.frameShape.toUpperCase() == 'GEOMETRIC').take(2).map((p) => p.id).toList();
      return AiStylistResponse(
        reply: "For a **round face shape**, angular and rectangular frames work best! They introduce clean lines to balance soft cheek contours and naturally elongate your facial features.\n\n• **Recommended:** Rectangular Bio-Acetate or Sharp Geometric frames\n• **Avoid:** Small perfectly circular wireframes",
        productIds: matches.isNotEmpty ? matches : (catalog.isNotEmpty ? [catalog.first.id] : []),
        suggestedQuestions: [
          "Which lenses are best for long screen time?",
          "What frames look best on an oval face?",
          "How does nationwide delivery work?",
        ],
      );
    }

    if (q.contains('screen') || q.contains('computer') || q.contains('blue') || q.contains('laptop') || q.contains('mobile')) {
      return AiStylistResponse(
        reply: "For heavy digital screen time, our **Blue Cut Screen Shield (Anti-Glare)** coating is essential! It filters high-energy 420nm blue wavelengths emitted by monitors and phones, reducing eye fatigue, dryness, and late-night sleep disruption.\n\n• **Price:** Included or +Rs. 850 upgrade with UV400 certification\n• **Treatment:** Multi-layer green anti-reflective coating",
        productIds: catalog.take(2).map((p) => p.id).toList(),
        suggestedQuestions: [
          "What are the best frames for high prescription?",
          "What frames look best on a square face?",
          "Can I upload my doctor slip directly?",
        ],
      );
    }

    if (q.contains('high prescription') || q.contains('high power') || q.contains('thick') || q.contains('-4') || q.contains('-5') || q.contains('-6')) {
      return AiStylistResponse(
        reply: "For strong prescriptions above -3.00 SPH, we recommend:\n\n1. **Ultra-Thin 1.67 High Index Lenses:** 35% lighter and significantly thinner than standard lenses to eliminate 'coke-bottle' edge thickness.\n2. **Frame Choice:** Pick smaller, full-rim acetate or titanium frames to conceal lens edge thickness naturally.",
        productIds: catalog.where((p) => p.material.toUpperCase() == 'ACETATE' || p.material.toUpperCase() == 'TITANIUM').take(2).map((p) => p.id).toList(),
        suggestedQuestions: [
          "How do I measure my Pupillary Distance (PD)?",
          "What is the difference between Single Vision and Progressive?",
          "Tell me about delivery in Pakistan.",
        ],
      );
    }

    if (q.contains('delivery') || q.contains('shipping') || q.contains('cod') || q.contains('pakistan') || q.contains('karachi') || q.contains('lahore')) {
      return AiStylistResponse(
        reply: "🚚 **Delivery Across Pakistan:**\n\n• **Flat Rate:** Rs. 250 nationwide via express courier.\n• **Free Shipping:** Automatically unlocked on all orders over **Rs. 3,000**.\n• **Payment:** Cash on Delivery (COD), JazzCash, EasyPaisa, or Direct Lab Bank Transfer.\n• **Timeline:** 2-4 business days for custom glazed prescription eyewear.",
        productIds: [],
        suggestedQuestions: [
          "What frames look best on a round face?",
          "Which lenses are best for long screen time?",
          "Can I chat with an optician on WhatsApp?",
        ],
      );
    }

    // Default welcome/helpful advice
    return AiStylistResponse(
      reply: "Welcome to **MY EYES Optical Lab**! I am your AI Frame & Lens Stylist.\n\nI can help you:\n• Match frames to your specific face shape\n• Choose between Clear, Blue Cut, and Transitions lenses\n• Verify your prescription numbers (SPH, CYL, AXIS, PD)\n\nWhat kind of eyewear are you looking for today?",
      productIds: catalog.take(2).map((p) => p.id).toList(),
      suggestedQuestions: [
        "What frames look best on a round face?",
        "Which lenses are best for long screen time?",
        "What are the best frames for high prescription?",
        "How does nationwide delivery work in Pakistan?",
      ],
    );
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

  /// Track customer order
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
