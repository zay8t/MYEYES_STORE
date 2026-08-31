import 'package:flutter/foundation.dart';
import '../models/product.dart';
import '../models/prescription.dart';
import '../models/cart_item.dart';

class LensPackageOption {
  final String id;
  final String title;
  final String subtitle;
  final String description;
  final String coating;
  final String index;
  final double basePrice;
  final double pricePlus40;
  final bool isProgressive;
  final bool isPopular;

  const LensPackageOption({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.description,
    required this.coating,
    required this.index,
    required this.basePrice,
    required this.pricePlus40,
    this.isProgressive = false,
    this.isPopular = false,
  });

  double getPrice(bool isPresbyopia) => isPresbyopia ? pricePlus40 : basePrice;

  String formattedPrice(bool isPresbyopia) {
    final p = getPrice(isPresbyopia);
    if (p == 0) return 'Included / Free';
    final rounded = p.round();
    final formatted = rounded.toString().replaceAllMapped(
          RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
          (Match m) => '${m[1]},',
        );
    return '+Rs. $formatted';
  }
}

class ConfiguratorProvider extends ChangeNotifier {
  // Current Selected Product
  Product? _currentProduct;
  String? _selectedColor;

  // Step Tracker (0 = Your Info, 1 = Choose Lenses, 2 = Prescription & Review)
  int _currentStep = 0;

  // Step 1: User Info
  String _customerName = '';
  int? _customerAge;
  String _customerPhone = '';
  bool _isLoggedIn = false;
  String? _loggedInUserName;

  // Presbyopia Clinical Triage
  bool _needsReadingLenses = false;
  double _selectedAddPower = 1.50; // Default +1.50

  // Step 2: Lens Package Selection
  String _selectedLensPackageId = 'sv-156-bluecut';

  // Step 3: Prescription Slip & Manual Powers
  String? _prescriptionSlipPath;
  bool _sendViaWhatsAppLater = true;
  double _odSph = 0.0;
  double? _odCyl;
  int? _odAxis;
  double _osSph = 0.0;
  double? _osCyl;
  int? _osAxis;
  double _pd = 63.0;
  String _doctorNotes = '';

  // ───────────────────────────────────────────────────────────────────────────
  // Core Lens Catalog Constants (Mirrored from web SOLEX & Core 5 options)
  // ───────────────────────────────────────────────────────────────────────────
  static const List<LensPackageOption> singleVisionPackages = [
    LensPackageOption(
      id: 'sv-156-bluecut',
      title: 'MY EYES Blue Light Filter + UV Protection',
      subtitle: 'Digital Shield',
      description: 'Digital protection blocking harmful screen blue light and 100% UV rays.',
      coating: 'Univex Blue Cut UV420',
      index: '1.56',
      basePrice: 1850,
      pricePlus40: 2250,
      isPopular: true,
    ),
    LensPackageOption(
      id: 'sv-156-photogrey',
      title: 'MY EYES Sun Adaptive Photochromic',
      subtitle: 'Smart Tint',
      description: 'Intelligent photochromic tint darkens outdoors in sunlight and clears indoors.',
      coating: 'Univex Light Intelligent Photochromic',
      index: '1.56',
      basePrice: 1950,
      pricePlus40: 2350,
    ),
    LensPackageOption(
      id: 'sv-156-photogrey-bluecut',
      title: 'MY EYES Dual Shield',
      subtitle: 'Blue Light & Photochromic',
      description: 'Ultimate dual protection: Photochromic tint outdoors with screen blue light filter indoors.',
      coating: 'Super Flat Blue + Photochromic',
      index: '1.56',
      basePrice: 3250,
      pricePlus40: 3650,
    ),
    LensPackageOption(
      id: 'sv-167-shmc',
      title: 'MY EYES Ultra Thin Index',
      subtitle: 'Ultra Thin Profile',
      description: 'Ultra-thin profile engineered for stronger prescriptions to significantly reduce lens thickness.',
      coating: 'Super Hydrophobic HMC',
      index: '1.67',
      basePrice: 1950,
      pricePlus40: 2350,
    ),
    LensPackageOption(
      id: 'sv-156-standard',
      title: 'Standard Clear Anti-Reflective',
      subtitle: 'Clear Vision',
      description: 'Classic clear lens with anti-scratch and anti-reflective coating included.',
      coating: 'Univex Green Anti-Reflective',
      index: '1.56',
      basePrice: 0,
      pricePlus40: 400,
    ),
  ];

  static const List<LensPackageOption> progressivePackages = [
    LensPackageOption(
      id: 'progressive-freeform',
      title: 'MY EYES CR Hard Crystal Progressive',
      subtitle: 'Seamless Vision',
      description: 'No-line smooth transition between distance, computer, and reading vision.',
      coating: 'Univex Progressive HMC',
      index: '1.56',
      basePrice: 850,
      pricePlus40: 1250,
      isProgressive: true,
      isPopular: true,
    ),
    LensPackageOption(
      id: 'progressive-bluecut',
      title: 'MY EYES Digital Progressive Blue Light Shield',
      subtitle: 'Digital Multifocal',
      description: 'Advanced no-line progressive optics with blue-light filter for screen workers.',
      coating: 'Univex Blue Cut UV420 Progressive',
      index: '1.56',
      basePrice: 2450,
      pricePlus40: 2850,
      isProgressive: true,
    ),
    LensPackageOption(
      id: 'progressive-photochromic',
      title: 'MY EYES Sun Adaptive Progressive',
      subtitle: 'Outdoor & Reading Multifocal',
      description: 'Photochromic progressive lenses that darken automatically under Pakistani sun.',
      coating: 'Photochromic Multi-Focal HMC',
      index: '1.56',
      basePrice: 2850,
      pricePlus40: 3250,
      isProgressive: true,
    ),
  ];

  // Getters
  Product? get currentProduct => _currentProduct;
  String? get selectedColor => _selectedColor;
  int get currentStep => _currentStep;
  String get customerName => _customerName;
  int? get customerAge => _customerAge;
  String get customerPhone => _customerPhone;
  bool get isLoggedIn => _isLoggedIn;
  String? get loggedInUserName => _loggedInUserName;
  bool get needsReadingLenses => _needsReadingLenses;
  double get selectedAddPower => _selectedAddPower;
  String get selectedLensPackageId => _selectedLensPackageId;
  String? get prescriptionSlipPath => _prescriptionSlipPath;
  bool get sendViaWhatsAppLater => _sendViaWhatsAppLater;
  double get odSph => _odSph;
  double? get odCyl => _odCyl;
  int? get odAxis => _odAxis;
  double get osSph => _osSph;
  double? get osCyl => _osCyl;
  int? get osAxis => _osAxis;
  double get pd => _pd;
  String get doctorNotes => _doctorNotes;

  /// Clinical Presbyopia Rule
  bool get isAgeGte40 => (_customerAge != null && _customerAge! >= 40);
  bool get isPresbyopia => isAgeGte40 && _needsReadingLenses;

  /// Active list of lens options based on clinical routing
  List<LensPackageOption> get availableLensPackages {
    return isPresbyopia ? progressivePackages : singleVisionPackages;
  }

  /// Selected Lens Option Object
  LensPackageOption get selectedLensOption {
    final all = [...singleVisionPackages, ...progressivePackages];
    return all.firstWhere(
      (opt) => opt.id == _selectedLensPackageId,
      orElse: () => availableLensPackages.first,
    );
  }

  double get framePrice => _currentProduct?.price ?? 0.0;
  double get lensPrice => selectedLensOption.getPrice(isPresbyopia);
  double get totalPrice => framePrice + lensPrice;

  String get formattedTotalPrice {
    final rounded = totalPrice.round();
    final formatted = rounded.toString().replaceAllMapped(
          RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
          (Match m) => '${m[1]},',
        );
    return 'Rs. $formatted';
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Actions & Mutations
  // ───────────────────────────────────────────────────────────────────────────

  void startConfiguration(Product product, {String? defaultColor}) {
    _currentProduct = product;
    _selectedColor = defaultColor ?? (product.colors.isNotEmpty ? product.colors[0] : null);
    _currentStep = 0;
    _selectedLensPackageId = singleVisionPackages.first.id;
    notifyListeners();
  }

  void setStep(int step) {
    _currentStep = step.clamp(0, 2);
    notifyListeners();
  }

  void nextStep() {
    if (_currentStep < 2) {
      _currentStep++;
      notifyListeners();
    }
  }

  void previousStep() {
    if (_currentStep > 0) {
      _currentStep--;
      notifyListeners();
    }
  }

  void setCustomerInfo({
    required String name,
    required int? age,
    required String phone,
    bool? needsReading,
  }) {
    _customerName = name;
    _customerAge = age;
    _customerPhone = phone;
    if (needsReading != null) {
      _needsReadingLenses = needsReading;
    }
    // Auto adjust default lens package based on clinical routing
    if (isPresbyopia) {
      _selectedLensPackageId = progressivePackages.first.id;
    } else {
      _selectedLensPackageId = singleVisionPackages.first.id;
    }
    notifyListeners();
  }

  void setNeedsReadingLenses(bool val) {
    _needsReadingLenses = val;
    if (isPresbyopia) {
      _selectedLensPackageId = progressivePackages.first.id;
    } else {
      _selectedLensPackageId = singleVisionPackages.first.id;
    }
    notifyListeners();
  }

  void setAddPower(double power) {
    _selectedAddPower = power;
    notifyListeners();
  }

  void selectLensPackage(String id) {
    _selectedLensPackageId = id;
    notifyListeners();
  }

  void setPrescriptionSlip(String? path) {
    _prescriptionSlipPath = path;
    _sendViaWhatsAppLater = path == null;
    notifyListeners();
  }

  void setSendViaWhatsAppLater(bool val) {
    _sendViaWhatsAppLater = val;
    if (val) {
      _prescriptionSlipPath = null;
    }
    notifyListeners();
  }

  void setManualPowers({
    required double odSph,
    double? odCyl,
    int? odAxis,
    required double osSph,
    double? osCyl,
    int? osAxis,
    required double pd,
    String? notes,
  }) {
    _odSph = odSph;
    _odCyl = odCyl;
    _odAxis = odAxis;
    _osSph = osSph;
    _osCyl = osCyl;
    _osAxis = osAxis;
    _pd = pd;
    if (notes != null) _doctorNotes = notes;
    notifyListeners();
  }

  /// Create fully configured CartItem to insert into CartProvider
  CartItem buildCartItem() {
    final product = _currentProduct!;
    final lens = selectedLensOption;

    Prescription? rx;
    if (!_sendViaWhatsAppLater || _odSph != 0 || _osSph != 0) {
      rx = Prescription(
        lensType: isPresbyopia ? 'PROGRESSIVE' : 'SINGLE_VISION',
        odSph: _odSph,
        odCyl: _odCyl,
        odAxis: _odAxis,
        osSph: _osSph,
        osCyl: _osCyl,
        osAxis: _osAxis,
        pd: _pd,
        addPower: isPresbyopia ? _selectedAddPower : null,
        fileUrl: _prescriptionSlipPath,
        notes: _doctorNotes.isNotEmpty ? _doctorNotes : null,
      );
    }

    return CartItem(
      id: '${product.id}_${DateTime.now().millisecondsSinceEpoch}',
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.firstImage,
      quantity: 1,
      selectedColor: _selectedColor,
      lensPackageId: lens.id,
      lensPackageName: lens.title,
      lensPackagePrice: lens.getPrice(isPresbyopia),
      prescription: rx,
    );
  }

  void reset() {
    _currentProduct = null;
    _currentStep = 0;
    _prescriptionSlipPath = null;
    _sendViaWhatsAppLater = true;
    notifyListeners();
  }
}
