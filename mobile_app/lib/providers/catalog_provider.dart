import 'package:flutter/foundation.dart';
import '../models/product.dart';
import '../services/api_service.dart';

class CatalogProvider extends ChangeNotifier {
  List<Product> _allProducts = [];
  bool _isLoading = false;
  String? _errorMessage;

  // Search & Filter State
  String _searchQuery = '';
  String _selectedCategory = 'ALL'; // 'ALL', 'EYEGLASSES', 'SUNGLASSES'
  final Set<String> _selectedShapes = {};
  final Set<String> _selectedMaterials = {};
  final Set<String> _selectedGenders = {};
  double _minPrice = 0;
  double _maxPrice = 25000;

  // Reactive Swatch selection map (productId -> selectedColorIndex)
  final Map<String, int> _activeSwatches = {};

  // Getters
  List<Product> get allProducts => _allProducts;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  String get searchQuery => _searchQuery;
  String get selectedCategory => _selectedCategory;
  Set<String> get selectedShapes => Set.unmodifiable(_selectedShapes);
  Set<String> get selectedMaterials => Set.unmodifiable(_selectedMaterials);
  Set<String> get selectedGenders => Set.unmodifiable(_selectedGenders);
  double get minPrice => _minPrice;
  double get maxPrice => _maxPrice;

  int get activeFilterCount {
    int count = 0;
    if (_selectedShapes.isNotEmpty) count += _selectedShapes.length;
    if (_selectedMaterials.isNotEmpty) count += _selectedMaterials.length;
    if (_selectedGenders.isNotEmpty) count += _selectedGenders.length;
    if (_minPrice > 0 || _maxPrice < 25000) count += 1;
    return count;
  }

  /// Get active swatch index for a given product
  int getActiveSwatchIndex(String productId) {
    return _activeSwatches[productId] ?? 0;
  }

  /// Set active swatch index for a given product dynamically
  void setProductSwatch(String productId, int index) {
    _activeSwatches[productId] = index;
    notifyListeners();
  }

  /// Main filtered products list
  List<Product> get filteredProducts {
    return _allProducts.where((product) {
      // 1. Search Query
      if (_searchQuery.isNotEmpty) {
        final q = _searchQuery.toLowerCase();
        final matchName = product.name.toLowerCase().contains(q);
        final matchShape = product.formattedShape.toLowerCase().contains(q);
        final matchMaterial = product.formattedMaterial.toLowerCase().contains(q);
        if (!matchName && !matchShape && !matchMaterial) return false;
      }

      // 2. Category
      if (_selectedCategory != 'ALL') {
        if (product.category.toUpperCase() != _selectedCategory.toUpperCase()) {
          return false;
        }
      }

      // 3. Shape Filter
      if (_selectedShapes.isNotEmpty) {
        final shapeKey = product.frameShape.toUpperCase();
        if (!_selectedShapes.contains(shapeKey)) return false;
      }

      // 4. Material Filter
      if (_selectedMaterials.isNotEmpty) {
        final matKey = product.material.toUpperCase();
        if (!_selectedMaterials.contains(matKey)) return false;
      }

      // 5. Gender Filter
      if (_selectedGenders.isNotEmpty) {
        final genderKey = product.gender.toUpperCase();
        final isMatch = _selectedGenders.any((g) =>
            genderKey == g.toUpperCase() ||
            genderKey == 'UNISEX' ||
            g.toUpperCase() == 'UNISEX');
        if (!isMatch) return false;
      }

      // 6. Price Range
      if (product.price < _minPrice || product.price > _maxPrice) {
        return false;
      }

      return true;
    }).toList();
  }

  /// Fetch products from backend
  Future<void> fetchProducts({bool forceRefresh = false}) async {
    if (_allProducts.isNotEmpty && !forceRefresh) return;

    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final fetched = await ApiService.getProducts();
      if (fetched.isNotEmpty) {
        _allProducts = fetched;
      } else {
        // Fallback sample catalog if backend offline
        _allProducts = _sampleFallbackCatalog();
      }
    } catch (e) {
      _errorMessage = 'Could not load products. Using offline collection.';
      _allProducts = _sampleFallbackCatalog();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void setSearchQuery(String query) {
    _searchQuery = query;
    notifyListeners();
  }

  void setCategory(String category) {
    _selectedCategory = category;
    notifyListeners();
  }

  void toggleShapeFilter(String shapeKey) {
    if (_selectedShapes.contains(shapeKey)) {
      _selectedShapes.remove(shapeKey);
    } else {
      _selectedShapes.add(shapeKey);
    }
    notifyListeners();
  }

  void toggleMaterialFilter(String matKey) {
    if (_selectedMaterials.contains(matKey)) {
      _selectedMaterials.remove(matKey);
    } else {
      _selectedMaterials.add(matKey);
    }
    notifyListeners();
  }

  void toggleGenderFilter(String genderKey) {
    if (_selectedGenders.contains(genderKey)) {
      _selectedGenders.remove(genderKey);
    } else {
      _selectedGenders.add(genderKey);
    }
    notifyListeners();
  }

  void setPriceRange(double min, double max) {
    _minPrice = min;
    _maxPrice = max;
    notifyListeners();
  }

  void resetFilters() {
    _selectedShapes.clear();
    _selectedMaterials.clear();
    _selectedGenders.clear();
    _minPrice = 0;
    _maxPrice = 25000;
    notifyListeners();
  }

  static List<Product> _sampleFallbackCatalog() {
    return [
      Product(
        id: 'prod-01',
        name: 'The Karachi Minimalist Oval',
        slug: 'karachi-minimalist-oval',
        description: 'Ultralight Japanese titanium frame engineered for all-day comfort and balanced face shapes.',
        price: 2450,
        stock: 15,
        frameShape: 'OVAL',
        material: 'TITANIUM',
        gender: 'Unisex',
        colors: ['#1E293B', '#FF7A00', '#D4AF37'],
        images: [
          'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1577803645773-f96470509666?w=800&auto=format&fit=crop&q=80',
        ],
        category: 'EYEGLASSES',
        featured: true,
        createdAt: DateTime.now(),
      ),
      Product(
        id: 'prod-02',
        name: 'Lahore Executive Square',
        slug: 'lahore-executive-square',
        description: 'Bold bio-acetate frames featuring precision hinges and sleek polished black edges.',
        price: 2850,
        stock: 22,
        frameShape: 'SQUARE',
        material: 'ACETATE',
        gender: 'Men',
        colors: ['#0F172A', '#78350F'],
        images: [
          'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&auto=format&fit=crop&q=80',
        ],
        category: 'EYEGLASSES',
        featured: true,
        createdAt: DateTime.now(),
      ),
      Product(
        id: 'prod-03',
        name: 'Islamabad Polarized Aviator',
        slug: 'islamabad-polarized-aviator',
        description: 'Iconic double-bridge sunglasses with 100% UV400 anti-glare polarized lenses.',
        price: 3200,
        stock: 12,
        frameShape: 'AVIATOR',
        material: 'METAL',
        gender: 'Unisex',
        colors: ['#D4AF37', '#334155'],
        images: [
          'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=800&auto=format&fit=crop&q=80',
        ],
        category: 'SUNGLASSES',
        featured: true,
        createdAt: DateTime.now(),
      ),
      Product(
        id: 'prod-04',
        name: 'Peshawar Retro Geometric',
        slug: 'peshawar-retro-geometric',
        description: 'Hexagonal architectural frame crafted from flexible TR-90 with gold accent temple arms.',
        price: 2650,
        stock: 18,
        frameShape: 'GEOMETRIC',
        material: 'TR90',
        gender: 'Women',
        colors: ['#9A3412', '#0F172A', '#F59E0B'],
        images: [
          'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=800&auto=format&fit=crop&q=80',
        ],
        category: 'EYEGLASSES',
        featured: false,
        createdAt: DateTime.now(),
      ),
      Product(
        id: 'prod-05',
        name: 'Margalla Featherlight Round',
        slug: 'margalla-featherlight-round',
        description: 'Classic circular wireframe with silicone nose pads and ultra-flexible spring hinges.',
        price: 2150,
        stock: 9,
        frameShape: 'ROUND',
        material: 'METAL',
        gender: 'Unisex',
        colors: ['#475569', '#D97706'],
        images: [
          'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&auto=format&fit=crop&q=80',
        ],
        category: 'EYEGLASSES',
        featured: true,
        createdAt: DateTime.now(),
      ),
    ];
  }
}
