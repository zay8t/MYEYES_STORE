import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'theme.dart';
import 'providers/catalog_provider.dart';
import 'providers/configurator_provider.dart';
import 'providers/cart_provider.dart';
import 'screens/catalog/catalog_screen.dart';
import 'screens/cart/cart_screen.dart';
import 'models/face_shape.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => CatalogProvider()),
        ChangeNotifierProvider(create: (_) => ConfiguratorProvider()),
        ChangeNotifierProvider(create: (_) => CartProvider()),
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

  final List<Widget> _screens = const [
    CatalogScreen(),
    FaceShapeScreen(),
    CartScreen(),
    AccountScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    final cartCount = context.watch<CartProvider>().itemCount;

    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (index) => setState(() => _currentIndex = index),
        backgroundColor: Colors.white,
        elevation: 8,
        indicatorColor: AppColors.primarySubtle,
        destinations: [
          const NavigationDestination(
            icon: Icon(LucideIcons.glasses),
            selectedIcon: Icon(LucideIcons.glasses, color: AppColors.primary),
            label: 'Frames',
          ),
          const NavigationDestination(
            icon: Icon(LucideIcons.sparkles),
            selectedIcon: Icon(LucideIcons.sparkles, color: AppColors.primary),
            label: 'Face Fit',
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
            label: 'Support',
          ),
        ],
      ),
    );
  }
}

/// --------------------------------------------------------------------------
/// Face Shape Diagnostic Screen
/// --------------------------------------------------------------------------
class FaceShapeScreen extends StatefulWidget {
  const FaceShapeScreen({super.key});

  @override
  State<FaceShapeScreen> createState() => _FaceShapeScreenState();
}

class _FaceShapeScreenState extends State<FaceShapeScreen> {
  int _selectedShapeIndex = 0;

  @override
  Widget build(BuildContext context) {
    final shape = FaceShapeData.allShapes[_selectedShapeIndex];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Face Shape Matcher'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'FIND YOUR FIT',
              style: TextStyle(color: AppColors.primary, fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 1.0),
            ),
            const SizedBox(height: 4),
            const Text(
              'Find the Best Glasses for Your Face Shape',
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: AppColors.slate900),
            ),
            const SizedBox(height: 8),
            const Text(
              'Pick your face shape below to see which frame styles look best on you.',
              style: TextStyle(fontSize: 13, color: AppColors.slate600),
            ),
            const SizedBox(height: 16),

            // Shape Selector Pills
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: List.generate(FaceShapeData.allShapes.length, (index) {
                  final s = FaceShapeData.allShapes[index];
                  final isSelected = _selectedShapeIndex == index;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text('${s.label} Shape'),
                      selected: isSelected,
                      onSelected: (val) {
                        if (val) setState(() => _selectedShapeIndex = index);
                      },
                      selectedColor: AppColors.primarySubtle,
                      labelStyle: TextStyle(
                        color: isSelected ? AppColors.primaryDark : AppColors.slate700,
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                      ),
                      side: BorderSide(
                        color: isSelected ? AppColors.primary : AppColors.slate200,
                      ),
                    ),
                  );
                }),
              ),
            ),
            const SizedBox(height: 20),

            // Diagnostic Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.slate200),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${shape.label} Face Shape',
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppColors.slate900),
                  ),
                  Text(
                    shape.tagline,
                    style: const TextStyle(fontSize: 12, color: AppColors.slate500),
                  ),
                  const Divider(height: 24, color: AppColors.slate100),
                  const Text('How to tell if this is you:', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.slate400)),
                  const SizedBox(height: 8),
                  ...shape.characteristics.map((c) => Padding(
                        padding: const EdgeInsets.only(bottom: 6),
                        child: Row(
                          children: [
                            const Icon(LucideIcons.checkCircle2, color: AppColors.success, size: 14),
                            const SizedBox(width: 8),
                            Expanded(child: Text(c, style: const TextStyle(fontSize: 12, color: AppColors.slate700))),
                          ],
                        ),
                      )),
                  const Divider(height: 24, color: AppColors.slate100),
                  const Text('Best Glasses Shapes for You:', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.slate400)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: shape.recommendedFrames
                        .map((f) => Chip(
                              label: Text(f, style: const TextStyle(fontSize: 11, color: AppColors.slate800)),
                              backgroundColor: AppColors.slate100,
                              side: BorderSide.none,
                              padding: EdgeInsets.zero,
                            ))
                        .toList(),
                  ),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.primarySubtle,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.primary.withOpacity(0.2)),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(LucideIcons.sparkles, color: AppColors.primary, size: 16),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Styling Tip', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primaryDark)),
                              const SizedBox(height: 2),
                              Text(shape.stylingTip, style: const TextStyle(fontSize: 11, color: AppColors.slate800, height: 1.3)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// --------------------------------------------------------------------------
/// Account & Studio Support Screen
/// --------------------------------------------------------------------------
class AccountScreen extends StatelessWidget {
  const AccountScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Customer Care & Studio'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
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
                  child: Icon(LucideIcons.user, color: AppColors.primary, size: 28),
                ),
                SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('MY EYES Studio Customer', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                      Text('Direct Optical Lab Support in Pakistan', style: TextStyle(color: AppColors.slate500, fontSize: 12)),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          _AccountTile(icon: LucideIcons.phoneCall, title: 'WhatsApp Optical Support (+923390103262)', onTap: () {}),
          _AccountTile(icon: LucideIcons.fileText, title: 'Lens Pricing & Coating Guide', onTap: () {}),
          _AccountTile(icon: LucideIcons.truck, title: 'Delivery Policy (Rs. 250 Flat Rate)', onTap: () {}),
          _AccountTile(icon: LucideIcons.shieldCheck, title: '100% Prescription Accuracy Guarantee', onTap: () {}),
        ],
      ),
    );
  }
}

class _AccountTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final VoidCallback onTap;

  const _AccountTile({required this.icon, required this.title, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: AppColors.slate700, size: 20),
      title: Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
      trailing: const Icon(LucideIcons.chevronRight, size: 16, color: AppColors.slate400),
      onTap: onTap,
    );
  }
}
