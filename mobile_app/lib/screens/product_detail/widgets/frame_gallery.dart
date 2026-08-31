import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../theme.dart';

class FrameGallery extends StatefulWidget {
  final List<String> images;
  final int initialIndex;

  const FrameGallery({
    super.key,
    required this.images,
    this.initialIndex = 0,
  });

  @override
  State<FrameGallery> createState() => _FrameGalleryState();
}

class _FrameGalleryState extends State<FrameGallery> {
  late PageController _pageController;
  int _currentPage = 0;

  @override
  void initState() {
    super.initState();
    _currentPage = widget.initialIndex;
    _pageController = PageController(initialPage: widget.initialIndex);
  }

  @override
  void didUpdateWidget(covariant FrameGallery oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.initialIndex != _currentPage && widget.initialIndex < widget.images.length) {
      _currentPage = widget.initialIndex;
      _pageController.jumpToPage(widget.initialIndex);
    }
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final displayImages = widget.images.isNotEmpty
        ? widget.images
        : ['https://placehold.co/800x600/f8fafc/0f172a?text=Eyewear+Frame'];

    return Container(
      height: 320,
      color: AppColors.slate50,
      child: Stack(
        alignment: Alignment.bottomCenter,
        children: [
          PageView.builder(
            controller: _pageController,
            itemCount: displayImages.length,
            onPageChanged: (idx) => setState(() => _currentPage = idx),
            itemBuilder: (context, index) {
              return InteractiveViewer(
                minScale: 0.8,
                maxScale: 3.0,
                child: CachedNetworkImage(
                  imageUrl: displayImages[index],
                  fit: BoxFit.contain,
                  placeholder: (_, __) => const Center(
                    child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
                  ),
                  errorWidget: (_, __, ___) => const Center(
                    child: Icon(LucideIcons.glasses, color: AppColors.slate300, size: 64),
                  ),
                ),
              );
            },
          ),

          // Swipeable Indicator Dots
          if (displayImages.length > 1)
            Positioned(
              bottom: 16,
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: List.generate(displayImages.length, (index) {
                  final isSelected = _currentPage == index;
                  return AnimatedContainer(
                    duration: const Duration(milliseconds: 250),
                    margin: const EdgeInsets.symmetric(horizontal: 3),
                    width: isSelected ? 20 : 6,
                    height: 6,
                    decoration: BoxDecoration(
                      color: isSelected ? AppColors.primary : AppColors.slate300,
                      borderRadius: BorderRadius.circular(3),
                    ),
                  );
                }),
              ),
            ),
        ],
      ),
    );
  }
}
