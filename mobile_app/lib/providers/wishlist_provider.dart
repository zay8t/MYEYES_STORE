import 'package:flutter/foundation.dart';
import '../models/product.dart';

class WishlistProvider extends ChangeNotifier {
  final Set<String> _wishlistIds = {};
  final List<Product> _savedProducts = [];

  Set<String> get wishlistIds => Set.unmodifiable(_wishlistIds);
  List<Product> get items => List.unmodifiable(_savedProducts);
  int get count => _savedProducts.length;

  bool isFavorite(String productId) => _wishlistIds.contains(productId);

  void toggleFavorite(Product product) {
    if (_wishlistIds.contains(product.id)) {
      _wishlistIds.remove(product.id);
      _savedProducts.removeWhere((p) => p.id == product.id);
    } else {
      _wishlistIds.add(product.id);
      _savedProducts.add(product);
    }
    notifyListeners();
  }

  void removeFromWishlist(String productId) {
    _wishlistIds.remove(productId);
    _savedProducts.removeWhere((p) => p.id == productId);
    notifyListeners();
  }

  void clearWishlist() {
    _wishlistIds.clear();
    _savedProducts.clear();
    notifyListeners();
  }
}
