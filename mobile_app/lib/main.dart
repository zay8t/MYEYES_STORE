import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';
import 'theme.dart';
import 'providers/catalog_provider.dart';
import 'providers/configurator_provider.dart';
import 'providers/cart_provider.dart';
import 'providers/wishlist_provider.dart';
import 'screens/home/home_screen.dart';
import 'screens/catalog/catalog_screen.dart';
import 'screens/cart/cart_screen.dart';
import 'screens/tools/tools_hub_screen.dart';
import 'screens/tools/pd_measurement_screen.dart';
import 'screens/wishlist/wishlist_screen.dart';
import 'screens/orders/order_tracking_screen.dart';
import 'screens/pricing_guide/lens_pricing_screen.dart';
import 'screens/ai/gemini_ai_stylist_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => CatalogProvider()),
        ChangeNotifierProvider(create: (_) => ConfiguratorProvider()),
        ChangeNotifierProvider(create: (_) => CartProvider()),
        ChangeNotifierProvider(create: (_) => WishlistProvider()),
      ],
      child: const MyEyesApp(),
    ),
  );
}

class MyEyesApp extends StatelessWidget {
  const MyEyesApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'MY EYES',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: const MainNavigationScreen(),
    );
  }
}

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _currentIndex = 0;

  void _navigateToTab(int index) {
    setState(() => _currentIndex = index);
  }

  @override
  Widget build(BuildContext context) {
    final cartCount = context.watch<CartProvider>().itemCount;

    final List<Widget> screens = [
      HomeScreen(onNavigateTab: _navigateToTab),
      const CatalogScreen(),
      const ToolsHubScreen(),
      const CartScreen(),
      AccountScreen(onNavigateTab: _navigateToTab),
    ];

    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: screens,
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (index) => setState(() => _currentIndex = index),
        backgroundColor: Colors.white,
        elevation: 8,
        indicatorColor: AppColors.primarySubtle,
        destinations: [
          const NavigationDestination(
            icon: Icon(LucideIcons.home),
            selectedIcon: Icon(LucideIcons.home, color: AppColors.primary),
            label: 'Home',
          ),
          const NavigationDestination(
            icon: Icon(LucideIcons.glasses),
            selectedIcon: Icon(LucideIcons.glasses, color: AppColors.primary),
            label: 'Frames',
          ),
          const NavigationDestination(
            icon: Icon(LucideIcons.sparkles),
            selectedIcon: Icon(LucideIcons.sparkles, color: AppColors.primary),
            label: 'Lab Tools',
          ),
          NavigationDestination(
            icon: Badge(
              isLabelVisible: cartCount > 0,
              label: Text('$cartCount'),
              backgroundColor: AppColors.primary,
              child: const Icon(LucideIcons.shoppingBag),
            ),
            selectedIcon: Badge(
              isLabelVisible: cartCount > 0,
              label: Text('$cartCount'),
              backgroundColor: AppColors.primary,
              child: const Icon(LucideIcons.shoppingBag, color: AppColors.primary),
            ),
            label: 'Bag',
          ),
          const NavigationDestination(
            icon: Icon(LucideIcons.user),
            selectedIcon: Icon(LucideIcons.user, color: AppColors.primary),
            label: 'Studio',
          ),
        ],
      ),
    );
  }
}

/// --------------------------------------------------------------------------
/// Account & Optical Studio Customer Care Screen
/// --------------------------------------------------------------------------
class AccountScreen extends StatelessWidget {
  final Function(int) onNavigateTab;

  const AccountScreen({super.key, required this.onNavigateTab});

  @override
  Widget build(BuildContext context) {
    final wishlist = context.watch<WishlistProvider>();

    return Scaffold(
      backgroundColor: AppColors.slate50,
      appBar: AppBar(
        title: const Text('Customer Care & Lab Studio'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Studio Profile Card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.slate200),
            ),
            child: const Row(
              children: [
                CircleAvatar(
                  radius: 28,
                  backgroundColor: AppColors.primarySubtle,
                  child: Icon(LucideIcons.glasses, color: AppColors.primary, size: 28),
                ),
                SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('MY EYES Studio Customer', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                      Text('Direct Optical Prescription Lab in Pakistan', style: TextStyle(color: AppColors.slate500, fontSize: 12)),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Menu Options
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.slate200),
            ),
            child: Column(
              children: [
                _AccountTile(
                  icon: LucideIcons.heart,
                  title: 'My Saved Wishlist (${wishlist.count} frames)',
                  badge: wishlist.count > 0 ? '${wishlist.count}' : null,
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const WishlistScreen()),
                    );
                  },
                ),
                const Divider(height: 1, indent: 56, color: AppColors.slate100),
                _AccountTile(
                  icon: LucideIcons.packageCheck,
                  title: 'Track Optical Prescription Order',
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const OrderTrackingScreen()),
                    );
                  },
                ),
                const Divider(height: 1, indent: 56, color: AppColors.slate100),
                _AccountTile(
                  icon: LucideIcons.fileText,
                  title: 'Lens Pricing & Coating Guide',
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const LensPricingScreen()),
                    );
                  },
                ),
                const Divider(height: 1, indent: 56, color: AppColors.slate100),
                _AccountTile(
                  icon: LucideIcons.ruler,
                  title: 'Pupillary Distance (PD) Tool',
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const PdMeasurementScreen()),
                    );
                  },
                ),
                const Divider(height: 1, indent: 56, color: AppColors.slate100),
                _AccountTile(
                  icon: LucideIcons.sparkles,
                  title: 'Consult Gemini AI Frame & Lens Stylist',
                  badge: 'AI',
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const GeminiAiStylistScreen()),
                    );
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Policies & Hotline Card
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.slate200),
            ),
            child: Column(
              children: [
                _AccountTile(
                  icon: LucideIcons.phoneCall,
                  title: 'WhatsApp Optician Support (+923390103262)',
                  onTap: () async {
                    final uri = Uri.parse('https://wa.me/923390103262?text=Hello%20MY%20EYES%20Lab%2C%20I%20need%20assistance%20with%20my%20prescription.');
                    if (await canLaunchUrl(uri)) {
                      await launchUrl(uri, mode: LaunchMode.externalApplication);
                    }
                  },
                ),
                const Divider(height: 1, indent: 56, color: AppColors.slate100),
                _AccountTile(
                  icon: LucideIcons.truck,
                  title: 'Delivery Policy (Rs. 250 Flat Across Pakistan)',
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Orders over Rs. 3,000 get FREE delivery across Pakistan!'),
                        backgroundColor: AppColors.slate900,
                      ),
                    );
                  },
                ),
                const Divider(height: 1, indent: 56, color: AppColors.slate100),
                _AccountTile(
                  icon: LucideIcons.shieldCheck,
                  title: '100% Prescription Accuracy Guarantee',
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Every custom lens is verified on digital lensometers before dispatch.'),
                        backgroundColor: AppColors.slate900,
                      ),
                    );
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _AccountTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? badge;
  final VoidCallback onTap;

  const _AccountTile({
    required this.icon,
    required this.title,
    this.badge,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: AppColors.slate700, size: 20),
      title: Text(title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.slate900)),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (badge != null) ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: AppColors.primary,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                badge!,
                style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
              ),
            ),
            const SizedBox(width: 8),
          ],
          const Icon(LucideIcons.chevronRight, size: 16, color: AppColors.slate400),
        ],
      ),
      onTap: onTap,
    );
  }
}
