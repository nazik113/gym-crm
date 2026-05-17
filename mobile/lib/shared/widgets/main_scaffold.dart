import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../theme/app_theme.dart';

class MainScaffold extends StatelessWidget {
  final Widget child;
  const MainScaffold({super.key, required this.child});

  static const _tabs = [
    _TabItem(path: '/dashboard',    icon: Icons.grid_view_rounded,      label: 'Home'),
    _TabItem(path: '/qr',           icon: Icons.qr_code_2_rounded,      label: 'QR Code'),
    _TabItem(path: '/workouts',     icon: Icons.fitness_center_rounded,  label: 'Workouts'),
    _TabItem(path: '/nutrition',    icon: Icons.restaurant_menu_rounded, label: 'Nutrition'),
    _TabItem(path: '/profile',      icon: Icons.person_rounded,          label: 'Profile'),
  ];

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    final idx = _tabs.indexWhere((t) => location.startsWith(t.path));
    return Scaffold(
      body: child,
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: AppColors.surface,
          border: Border(top: BorderSide(color: AppColors.divider)),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: List.generate(_tabs.length, (i) {
                final tab = _tabs[i];
                final active = i == idx;
                return _NavItem(tab: tab, active: active, onTap: () => context.go(tab.path));
              }),
            ),
          ),
        ),
      ),
    );
  }
}

class _TabItem { final String path, label; final IconData icon; const _TabItem({required this.path, required this.icon, required this.label}); }

class _NavItem extends StatelessWidget {
  final _TabItem tab;
  final bool active;
  final VoidCallback onTap;
  const _NavItem({required this.tab, required this.active, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(14),
          color: active ? AppColors.primary.withOpacity(0.15) : Colors.transparent,
        ),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Icon(tab.icon, color: active ? AppColors.primaryLight : AppColors.textSecondary, size: 22),
          const SizedBox(height: 3),
          Text(tab.label, style: TextStyle(fontSize: 10, fontWeight: active ? FontWeight.w600 : FontWeight.w400,
            color: active ? AppColors.primaryLight : AppColors.textSecondary)),
        ]),
      ),
    );
  }
}
