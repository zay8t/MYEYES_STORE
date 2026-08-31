class Prescription {
  final String? id;
  final String lensType; // "SINGLE_VISION", "BIFOCAL", "PROGRESSIVE"
  final double odSph;    // Right Sphere (-10.00 to +8.00)
  final double? odCyl;   // Right Cylinder (-6.00 to +6.00)
  final int? odAxis;     // Right Axis (1 to 180)
  final double osSph;    // Left Sphere
  final double? osCyl;   // Left Cylinder
  final int? osAxis;     // Left Axis
  final double pd;       // Pupillary Distance (50.0 to 75.0)
  final double? addPower;// Reading Add Power for progressive/bifocal
  final String? fileUrl; // Prescription slip image
  final String? notes;

  Prescription({
    this.id,
    this.lensType = 'SINGLE_VISION',
    required this.odSph,
    this.odCyl,
    this.odAxis,
    required this.osSph,
    this.osCyl,
    this.osAxis,
    required this.pd,
    this.addPower,
    this.fileUrl,
    this.notes,
  });

  /// Human readable label for lens type
  String get lensTypeLabel {
    switch (lensType.toUpperCase()) {
      case 'PROGRESSIVE':
        return 'Progressive (No Line Multifocal)';
      case 'BIFOCAL':
        return 'Bifocal (Distance + Reading)';
      default:
        return 'Single Vision (Distance / Reading)';
    }
  }

  factory Prescription.fromJson(Map<String, dynamic> json) {
    return Prescription(
      id: json['id']?.toString(),
      lensType: json['lensType']?.toString() ?? 'SINGLE_VISION',
      odSph: (json['odSph'] is num) ? (json['odSph'] as num).toDouble() : double.tryParse(json['odSph']?.toString() ?? '0') ?? 0.0,
      odCyl: (json['odCyl'] is num) ? (json['odCyl'] as num).toDouble() : double.tryParse(json['odCyl']?.toString() ?? ''),
      odAxis: (json['odAxis'] is num) ? (json['odAxis'] as num).toInt() : int.tryParse(json['odAxis']?.toString() ?? ''),
      osSph: (json['osSph'] is num) ? (json['osSph'] as num).toDouble() : double.tryParse(json['osSph']?.toString() ?? '0') ?? 0.0,
      osCyl: (json['osCyl'] is num) ? (json['osCyl'] as num).toDouble() : double.tryParse(json['osCyl']?.toString() ?? ''),
      osAxis: (json['osAxis'] is num) ? (json['osAxis'] as num).toInt() : int.tryParse(json['osAxis']?.toString() ?? ''),
      pd: (json['pd'] is num) ? (json['pd'] as num).toDouble() : double.tryParse(json['pd']?.toString() ?? '62.0') ?? 62.0,
      addPower: (json['addPower'] is num) ? (json['addPower'] as num).toDouble() : double.tryParse(json['addPower']?.toString() ?? ''),
      fileUrl: json['fileUrl']?.toString() ?? json['prescription_url']?.toString(),
      notes: json['notes']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      'lensType': lensType,
      'odSph': odSph,
      if (odCyl != null) 'odCyl': odCyl,
      if (odAxis != null) 'odAxis': odAxis,
      'osSph': osSph,
      if (osCyl != null) 'osCyl': osCyl,
      if (osAxis != null) 'osAxis': osAxis,
      'pd': pd,
      if (addPower != null) 'addPower': addPower,
      if (fileUrl != null) 'fileUrl': fileUrl,
      if (notes != null) 'notes': notes,
    };
  }
}
