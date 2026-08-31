enum FaceShapeType {
  oval,
  round,
  square,
  heart,
}

class FaceShapeData {
  final String id;
  final String label;
  final String tagline;
  final List<String> characteristics;
  final List<String> recommendedFrames;
  final String stylingTip;
  final List<String> targetShapeKeys;

  const FaceShapeData({
    required this.id,
    required this.label,
    required this.tagline,
    required this.characteristics,
    required this.recommendedFrames,
    required this.stylingTip,
    required this.targetShapeKeys,
  });

  static const List<FaceShapeData> allShapes = [
    FaceShapeData(
      id: 'oval',
      label: 'Oval',
      tagline: 'Balanced face with a soft, rounded jaw',
      characteristics: [
        'Forehead is slightly wider than your chin',
        'Face is slightly longer than it is wide',
        'Soft, high cheekbones',
      ],
      recommendedFrames: [
        'Sharp Geometric',
        'Wide Rectangle',
        'Classic Square',
        'Classic Aviator',
      ],
      stylingTip: 'Pick frames that are just as wide as or slightly wider than your face.',
      targetShapeKeys: ['RECTANGLE', 'GEOMETRIC', 'SQUARE', 'AVIATOR', 'WAYFARER'],
    ),
    FaceShapeData(
      id: 'round',
      label: 'Round',
      tagline: 'Soft, curved cheeks with equal width and height',
      characteristics: [
        'Face is about as wide as it is long',
        'Soft, rounded jaw with no sharp corners',
        'Fuller, round cheeks',
      ],
      recommendedFrames: [
        'Sharp Rectangle',
        'Wide Square',
        'Geometric Shapes',
        'Classic Wayfarer',
      ],
      stylingTip: 'Choose angular and rectangular frames to add sharp lines and make your face look slimmer.',
      targetShapeKeys: ['RECTANGLE', 'SQUARE', 'WAYFARER', 'GEOMETRIC'],
    ),
    FaceShapeData(
      id: 'square',
      label: 'Square',
      tagline: 'Strong, wide jaw with balanced angles',
      characteristics: [
        'Strong, sharp jawline',
        'Forehead, cheeks, and jaw are all the same width',
        'Straight sides with clear lines',
      ],
      recommendedFrames: [
        'Round Frames',
        'Soft Oval',
        'Classic Aviator',
        'Thin Metal Wireframes',
      ],
      stylingTip: 'Pick round or oval frames to soften strong jawlines and balance your look.',
      targetShapeKeys: ['ROUND', 'OVAL', 'AVIATOR', 'RIMLESS'],
    ),
    FaceShapeData(
      id: 'heart',
      label: 'Heart',
      tagline: 'Wider forehead with a neat, pointed chin',
      characteristics: [
        'Widest at your forehead and cheekbones',
        'Narrows down gently to your chin',
        'Small, tapered chin',
      ],
      recommendedFrames: [
        'Round Wireframes',
        'Soft Oval',
        'Subtle Cat-Eye',
        'Light Rimless Frames',
      ],
      stylingTip: 'Pick round or bottom-wider frames to balance your forehead and chin.',
      targetShapeKeys: ['ROUND', 'CAT_EYE', 'OVAL', 'RIMLESS', 'AVIATOR'],
    ),
  ];
}
