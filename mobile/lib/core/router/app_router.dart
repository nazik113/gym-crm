import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/presentation/pages/login_page.dart';
import '../../features/auth/presentation/pages/register_page.dart';
import '../../features/dashboard/presentation/pages/dashboard_page.dart';
import '../../features/qr/presentation/pages/qr_page.dart';
import '../../features/workouts/presentation/pages/workouts_page.dart';
import '../../features/nutrition/presentation/pages/nutrition_page.dart';
import '../../features/attendance/presentation/pages/attendance_page.dart';
import '../../features/subscription/presentation/pages/subscription_page.dart';
import '../../features/profile/presentation/pages/profile_page.dart';
import '../../shared/widgets/main_scaffold.dart';
import '../providers/auth_provider.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);
  return GoRouter(
    initialLocation: '/auth/login',
    redirect: (context, state) {
      final isLoggedIn = authState.isAuthenticated;
      final isAuthRoute = state.matchedLocation.startsWith('/auth');
      if (!isLoggedIn && !isAuthRoute) return '/auth/login';
      if (isLoggedIn && isAuthRoute) return '/dashboard';
      return null;
    },
    routes: [
      GoRoute(path: '/auth/login',    builder: (_, __) => const LoginPage()),
      GoRoute(path: '/auth/register', builder: (_, __) => const RegisterPage()),
      ShellRoute(
        builder: (ctx, state, child) => MainScaffold(child: child),
        routes: [
          GoRoute(path: '/dashboard',   builder: (_, __) => const DashboardPage()),
          GoRoute(path: '/qr',          builder: (_, __) => const QRPage()),
          GoRoute(path: '/workouts',    builder: (_, __) => const WorkoutsPage()),
          GoRoute(path: '/nutrition',   builder: (_, __) => const NutritionPage()),
          GoRoute(path: '/attendance',  builder: (_, __) => const AttendancePage()),
          GoRoute(path: '/subscription',builder: (_, __) => const SubscriptionPage()),
          GoRoute(path: '/profile',     builder: (_, __) => const ProfilePage()),
        ],
      ),
    ],
  );
});
