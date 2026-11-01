import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../theme.dart';
import '../../models/product.dart';
import '../../providers/catalog_provider.dart';
import '../../providers/wishlist_provider.dart';
import '../../providers/cart_provider.dart';
import '../../providers/configurator_provider.dart';
import '../product_detail/product_detail_screen.dart';
import '../configurator/lens_configurator_modal.dart';
import '../wishlist/wishlist_screen.dart';
import '../tools/lens_simulator_screen.dart';
import '../tools/quiz_screen.dart';
import '../tools/pd_measurement_screen.dart';
import '../ai/my_eyes_ai_screen.dart';
import '../../main.dart';

class HomeScreen extends StatelessWidget {
  final Function(int) onNavigateTab;

  const HomeScreen({
    super.key,
    required this.onNavigateTab,
  });

  @override
  Widget build(BuildContext context) {
    final catalog = context.watch<CatalogProvider>();
    final wishlist = context.watch<WishlistProvider>();
    final cart = context.watch<CartProvider>();
    final featuredProducts = catalog.allProducts.take(6).toList();

    return Scaffold(
      backgroundColor: AppColors.slate50,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: AppColors.slate900,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Text(
                'MY EYES',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 14,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1.5,
                ),
              ),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
              decoration: BoxDecoration(
                color: AppColors.primarySubtle,
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: AppColors.primary.withOpacity(0.3)),
              ),
              child: const Text(
                'OPTICAL LAB',
                style: TextStyle(
                  color: AppColors.primaryDark,
                  fontSize: 9,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.5,
                ),
              ),
            ),
          ],
        ),
        actions: [
          // Wishlist Icon
          IconButton(
            icon: Badge(
              isLabelVisible: wishlist.count > 0,
              label: Text('${wishlist.count}'),
              backgroundColor: AppColors.primary,
              child: const Icon(LucideIcons.heart, size: 20, color: AppColors.slate700),
            ),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const WishlistScreen()),
              );
            },
          ),
          // Bag Icon
          IconButton(
            icon: Badge(
              isLabelVisible: cart.itemCount > 0,
              label: Text('${cart.itemCount}'),
              backgroundColor: AppColors.primary,
              child: const Icon(LucideIcons.shoppingBag, size: 20, color: AppColors.slate700),
            ),
            onPressed: () => onNavigateTab(3), // Switch to Bag Tab
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => catalog.fetchProducts(forceRefresh: true),
        color: AppColors.primary,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. Store Announcement Banner
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
                color: AppColors.primary,
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(LucideIcons.sparkles, size: 14, color: Colors.white),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        "Pakistan's 1st Prescription Eyewear Store • Flat Rs. 250 Delivery",
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                        ),
                        textAlign: TextAlign.center,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),

              // 2. Hero Card
              Padding(
                padding: const EdgeInsets.all(16),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(22),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.12),
                        blurRadius: 16,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: AppColors.primary.withOpacity(0.5)),
                        ),
                        child: const Text(
                          '100% PRESCRIPTION GUARANTEE',
                          style: TextStyle(
                            color: AppColors.primaryLight,
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 0.8,
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      const Text(
                        'Precision Eyewear,\nCrafted in Our Lab.',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 24,
                          fontWeight: FontWeight.w900,
                          height: 1.15,
                          letterSpacing: -0.5,
                        ),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Order frames with custom Single Vision, Blue Cut, or Progressive lenses tailored to your doctor slip.',
                        style: TextStyle(
                          color: AppColors.slate300,
                          fontSize: 12,
                          height: 1.4,
                        ),
                      ),
                      const SizedBox(height: 18),
                      Row(
                        children: [
                          ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.primary,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            icon: const Icon(LucideIcons.glasses, size: 16),
                            label: const Text('Browse Frames', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800)),
                            onPressed: () => onNavigateTab(1), // Catalog tab
                          ),
                          const SizedBox(width: 10),
                          OutlinedButton.icon(
                            style: OutlinedButton.styleFrom(
                              foregroundColor: Colors.white,
                              side: const BorderSide(color: Colors.white24),
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            icon: const Icon(LucideIcons.sparkles, size: 15, color: AppColors.primaryLight),
                            label: const Text('Style Quiz', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                            onPressed: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(builder: (_) => const QuizScreen()),
                              );
                            },
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),

              // Ask MY EYES Banner
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: GestureDetector(
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const MyEyesAiScreen()),
                    );
                  },
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF0F172A), Color(0xFF334155)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: AppColors.primary.withOpacity(0.3)),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: const BoxDecoration(
                            color: AppColors.primary,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(LucideIcons.sparkles, color: Colors.white, size: 20),
                        ),
                        const SizedBox(width: 14),
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Ask MY EYES',
                                style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 14),
                              ),
                              SizedBox(height: 2),
                              Text(
                                'Not sure what frames suit you? Just ask us.',
                                style: TextStyle(color: AppColors.slate300, fontSize: 11),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                          decoration: BoxDecoration(
                            color: AppColors.primary,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Text('Chat', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 11, color: Colors.white)),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // 3. Quick Category Navigation
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Categories',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: AppColors.slate900),
                    ),
                    TextButton(
                      onPressed: () => onNavigateTab(1),
                      child: const Text('View All', style: TextStyle(color: AppColors.primary, fontSize: 12, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 4),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  children: [
                    _buildCategoryTile(
                      icon: LucideIcons.glasses,
                      title: 'Eyeglasses',
                      subtitle: 'Clear & Blue Cut',
                      onTap: () {
                        catalog.setCategory('EYEGLASSES');
                        onNavigateTab(1);
                      },
                    ),
                    const SizedBox(width: 10),
                    _buildCategoryTile(
                      icon: LucideIcons.sun,
                      title: 'Sunglasses',
                      subtitle: 'UV400 Polarized',
                      onTap: () {
                        catalog.setCategory('SUNGLASSES');
                        onNavigateTab(1);
                      },
                    ),
                    const SizedBox(width: 10),
                    _buildCategoryTile(
                      icon: LucideIcons.user,
                      title: "Men's Frames",
                      subtitle: 'Classic & Sleek',
                      onTap: () {
                        catalog.resetFilters();
                        catalog.toggleGenderFilter('Men');
                        onNavigateTab(1);
                      },
                    ),
                    const SizedBox(width: 10),
                    _buildCategoryTile(
                      icon: LucideIcons.sparkles,
                      title: "Women's",
                      subtitle: 'Cat-Eye & Chic',
                      onTap: () {
                        catalog.resetFilters();
                        catalog.toggleGenderFilter('Women');
                        onNavigateTab(1);
                      },
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // 4. Optical Lab Interactive Tools Carousel
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: AppColors.primarySubtle,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(LucideIcons.cpu, size: 16, color: AppColors.primary),
                    ),
                    const SizedBox(width: 10),
                    const Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Interactive Optical Tools', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: AppColors.slate900)),
                        Text('Digital consultation & vision tools', style: TextStyle(fontSize: 11, color: AppColors.slate500)),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisSpacing: 10,
                  mainAxisSpacing: 10,
                  childAspectRatio: 1.45,
                  children: [
                    _buildToolCard(
                      title: 'Lens Simulator',
                      desc: 'Clear vs Blue Cut vs Photochromic',
                      icon: LucideIcons.eye,
                      badge: 'Interactive',
                      badgeColor: AppColors.primary,
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const LensSimulatorScreen()),
                        );
                      },
                    ),
                    _buildToolCard(
                      title: 'Face Shape Match',
                      desc: 'Discover best frame geometry',
                      icon: LucideIcons.scanFace,
                      badge: 'Style Guide',
                      badgeColor: const Color(0xFF6366F1),
                      onTap: () => onNavigateTab(2), // Switch to Tools/Face Fit tab
                    ),
                    _buildToolCard(
                      title: 'PD Measurement',
                      desc: 'Pupillary distance caliper tool',
                      icon: LucideIcons.ruler,
                      badge: 'Precision',
                      badgeColor: AppColors.success,
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const PdMeasurementScreen()),
                        );
                      },
                    ),
                    _buildToolCard(
                      title: 'Eyewear Quiz',
                      desc: 'Find your style in 4 questions',
                      icon: LucideIcons.helpCircle,
                      badge: '60 Sec',
                      badgeColor: const Color(0xFFE11D48),
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const QuizScreen()),
                        );
                      },
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // 5. Promotional Voucher Strip
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.primarySubtle,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.primary.withOpacity(0.3)),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: const BoxDecoration(
                          color: AppColors.primary,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(LucideIcons.tag, color: Colors.white, size: 16),
                      ),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Special Launch Offer: Code MYEYES10',
                              style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: AppColors.primaryDark),
                            ),
                            Text(
                              'Get 10% OFF + FREE Delivery over Rs. 3,000 anywhere in Pakistan.',
                              style: TextStyle(fontSize: 11, color: AppColors.slate700),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // 6. Featured Frames Carousel
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Trending Lab Frames',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: AppColors.slate900),
                    ),
                    TextButton(
                      onPressed: () => onNavigateTab(1),
                      child: const Text('View All', style: TextStyle(color: AppColors.primary, fontSize: 12, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 8),

              SizedBox(
                height: 260,
                child: ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  scrollDirection: Axis.horizontal,
                  itemCount: featuredProducts.length,
                  itemBuilder: (context, index) {
                    final product = featuredProducts[index];
                    final isFav = wishlist.isFavorite(product.id);

                    return Container(
                      width: 175,
                      margin: const EdgeInsets.only(right: 12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.slate200),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.02),
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: InkWell(
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => ProductDetailScreen(product: product),
                            ),
                          );
                        },
                        borderRadius: BorderRadius.circular(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Frame Image with Wishlist Button
                            Stack(
                              children: [
                                ClipRRect(
                                  borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                                  child: Container(
                                    height: 120,
                                    width: double.infinity,
                                    color: AppColors.slate100,
                                    child: CachedNetworkImage(
                                      imageUrl: product.firstImage,
                                      fit: BoxFit.cover,
                                      errorWidget: (_, __, ___) => const Icon(LucideIcons.glasses, size: 36, color: AppColors.slate300),
                                    ),
                                  ),
                                ),
                                Positioned(
                                  top: 6,
                                  right: 6,
                                  child: GestureDetector(
                                    onTap: () => wishlist.toggleFavorite(product),
                                    child: Container(
                                      padding: const EdgeInsets.all(5),
                                      decoration: const BoxDecoration(
                                        color: Colors.white,
                                        shape: BoxShape.circle,
                                      ),
                                      child: Icon(
                                        LucideIcons.heart,
                                        size: 14,
                                        color: isFav ? AppColors.error : AppColors.slate400,
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            // Details
                            Padding(
                              padding: const EdgeInsets.all(10),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    product.name,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: AppColors.slate900),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    '${product.formattedShape} • ${product.formattedMaterial}',
                                    style: const TextStyle(fontSize: 10, color: AppColors.slate500),
                                  ),
                                  const SizedBox(height: 8),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        product.formattedPrice,
                                        style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13, color: AppColors.primary),
                                      ),
                                      GestureDetector(
                                        onTap: () {
                                          context.read<ConfiguratorProvider>().startConfiguration(product);
                                          LensConfiguratorModal.show(context);
                                        },
                                        child: Container(
                                          padding: const EdgeInsets.all(6),
                                          decoration: const BoxDecoration(
                                            color: AppColors.slate900,
                                            shape: BoxShape.circle,
                                          ),
                                          child: const Icon(LucideIcons.plus, size: 12, color: Colors.white),
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 24),

              // 7. Trust Guarantees Strip
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppColors.slate200),
                  ),
                  child: Column(
                    children: [
                      _buildGuaranteeRow(
                        icon: LucideIcons.shieldCheck,
                        title: '100% Prescription Accuracy Guarantee',
                        desc: 'Every lens is electronically verified with computerized digital lensometers.',
                      ),
                      const Divider(height: 20, color: AppColors.slate100),
                      _buildGuaranteeRow(
                        icon: LucideIcons.truck,
                        title: 'Flat Rs. 250 Delivery Everywhere in Pakistan',
                        desc: 'Dispatched via leading express couriers with real-time tracking.',
                      ),
                      const Divider(height: 20, color: AppColors.slate100),
                      _buildGuaranteeRow(
                        icon: LucideIcons.messageSquare,
                        title: 'Direct Optician WhatsApp Consultation',
                        desc: 'Need advice? Send your doctor slip directly to our lab optometrists.',
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // 8. WhatsApp Hotline Banner
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: GestureDetector(
                  onTap: () async {
                    final uri = Uri.parse('https://wa.me/923390103262?text=Hello%20MY%20EYES%20Lab%2C%20I%20have%20a%20prescription%20inquiry.');
                    if (await canLaunchUrl(uri)) {
                      await launchUrl(uri, mode: LaunchMode.externalApplication);
                    }
                  },
                  child: Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: const Color(0xFF075E54), // WhatsApp Emerald
                      borderRadius: BorderRadius.circular(18),
                    ),
                    child: const Row(
                      children: [
                        Icon(LucideIcons.messageCircle, color: Colors.white, size: 28),
                        SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Need Optical Help? Chat on WhatsApp',
                                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                              ),
                              SizedBox(height: 2),
                              Text(
                                '+92 339 0103262 • Instant Prescription Review',
                                style: TextStyle(color: Colors.white70, fontSize: 11),
                              ),
                            ],
                          ),
                        ),
                        Icon(LucideIcons.chevronRight, color: Colors.white, size: 20),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCategoryTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 130,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.slate200),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: const BoxDecoration(
                color: AppColors.slate100,
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 18, color: AppColors.slate800),
            ),
            const SizedBox(height: 10),
            Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.slate900)),
            const SizedBox(height: 2),
            Text(subtitle, style: const TextStyle(fontSize: 10, color: AppColors.slate500)),
          ],
        ),
      ),
    );
  }

  Widget _buildToolCard({
    required String title,
    required String desc,
    required IconData icon,
    required String badge,
    required Color badgeColor,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.slate200),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Icon(icon, size: 18, color: AppColors.slate800),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: badgeColor.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    badge,
                    style: TextStyle(color: badgeColor, fontSize: 9, fontWeight: FontWeight.w800),
                  ),
                ),
              ],
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: AppColors.slate900)),
                const SizedBox(height: 2),
                Text(desc, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 10, color: AppColors.slate500)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGuaranteeRow({
    required IconData icon,
    required String title,
    required String desc,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: AppColors.primary, size: 20),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: AppColors.slate900)),
              const SizedBox(height: 2),
              Text(desc, style: const TextStyle(fontSize: 11, color: AppColors.slate600, height: 1.3)),
            ],
          ),
        ),
      ],
    );
  }
}
