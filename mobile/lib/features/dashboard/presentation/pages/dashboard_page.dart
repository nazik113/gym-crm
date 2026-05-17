import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/providers/auth_provider.dart';
import '../../../../shared/theme/app_theme.dart';
import '../../../../shared/widgets/gym_card.dart';
import '../../../../shared/widgets/stat_chip.dart';

class DashboardPage extends ConsumerWidget {
  const DashboardPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authStateProvider).user;
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 140,
            pinned: true,
            backgroundColor: AppColors.background,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight,
                    colors: [Color(0xFF1A0A2E), AppColors.background]),
                ),
                padding: const EdgeInsets.fromLTRB(24, 56, 24, 16),
                child: Row(children: [
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('Good ${_greeting()} 👋', style: const TextStyle(color: AppColors.textSecondary, fontSize: 14)),
                    const SizedBox(height: 4),
                    Text(user?.firstName ?? 'Athlete', style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: AppColors.textPrimary)),
                  ])),
                  GestureDetector(
                    onTap: () => context.push('/profile'),
                    child: CircleAvatar(
                      radius: 24,
                      backgroundColor: AppColors.primary,
                      child: Text('${user?.firstName[0] ?? '?'}${user?.lastName[0] ?? ''}',
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 16)),
                    ),
                  ),
                ]),
              ),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.all(20),
            sliver: SliverList(delegate: SliverChildListDelegate([
              // Quick stats
              if (user?.activeSubscription != null) ...[
                _SectionTitle('My Subscription'),
                const SizedBox(height: 12),
                GymCard(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Row(children: [
                      Container(width: 12, height: 12, decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(3))),
                      const SizedBox(width: 8),
                      Text(user!.activeSubscription!.plan?.name ?? 'Active Plan',
                        style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                      const Spacer(),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(color: AppColors.green.withOpacity(0.15), borderRadius: BorderRadius.circular(20)),
                        child: const Text('Active', style: TextStyle(color: AppColors.green, fontSize: 12, fontWeight: FontWeight.w600)),
                      ),
                    ]),
                    const SizedBox(height: 16),
                    Row(children: [
                      StatChip(label: 'Sessions Left', value: '${user.activeSubscription!.sessionsRemaining ?? '∞'}', color: AppColors.cyan),
                      const SizedBox(width: 12),
                      StatChip(label: 'Expires', value: user.activeSubscription!.expiresAt.substring(0, 10), color: AppColors.orange),
                    ]),
                  ]),
                ),
                const SizedBox(height: 24),
              ],

              // Quick actions
              _SectionTitle('Quick Actions'),
              const SizedBox(height: 12),
              GridView.count(
                shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
                crossAxisCount: 2, crossAxisSpacing: 12, mainAxisSpacing: 12, childAspectRatio: 1.3,
                children: [
                  _QuickAction(icon: Icons.qr_code_2_rounded, label: 'My QR Code', color: AppColors.primary, onTap: () => context.push('/qr')),
                  _QuickAction(icon: Icons.fitness_center_rounded, label: 'Workouts', color: AppColors.cyan, onTap: () => context.push('/workouts')),
                  _QuickAction(icon: Icons.restaurant_menu_rounded, label: 'Nutrition', color: AppColors.green, onTap: () => context.push('/nutrition')),
                  _QuickAction(icon: Icons.calendar_today_rounded, label: 'Attendance', color: AppColors.orange, onTap: () => context.push('/attendance')),
                ],
              ),
              const SizedBox(height: 100),
            ])),
          ),
        ],
      ),
    );
  }

  String _greeting() {
    final h = DateTime.now().hour;
    if (h < 12) return 'morning';
    if (h < 18) return 'afternoon';
    return 'evening';
  }
}

class _SectionTitle extends StatelessWidget {
  final String text;
  const _SectionTitle(this.text);
  @override Widget build(BuildContext context) =>
    Text(text, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.textPrimary));
}

class _QuickAction extends StatelessWidget {
  final IconData icon; final String label; final Color color; final VoidCallback onTap;
  const _QuickAction({required this.icon, required this.label, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          color: color.withOpacity(0.08),
          border: Border.all(color: color.withOpacity(0.2)),
        ),
        padding: const EdgeInsets.all(16),
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          Icon(icon, color: color, size: 28),
          const SizedBox(height: 8),
          Text(label, style: TextStyle(color: color, fontWeight: FontWeight.w600, fontSize: 13), textAlign: TextAlign.center),
        ]),
      ),
    );
  }
}
