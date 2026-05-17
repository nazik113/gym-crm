import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/providers/auth_provider.dart';
import '../../../../shared/theme/app_theme.dart';
import '../../data/repositories/auth_repository.dart';

class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key});
  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage> with TickerProviderStateMixin {
  final _phoneCtrl    = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _loading = false;
  bool _obscure = true;
  late AnimationController _fadeCtrl;
  late Animation<double> _fadeAnim;

  @override
  void initState() {
    super.initState();
    _fadeCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 600));
    _fadeAnim = CurvedAnimation(parent: _fadeCtrl, curve: Curves.easeOut);
    _fadeCtrl.forward();
  }

  @override
  void dispose() { _fadeCtrl.dispose(); super.dispose(); }

  Future<void> _login() async {
    if (_phoneCtrl.text.isEmpty || _passwordCtrl.text.isEmpty) return;
    setState(() => _loading = true);
    try {
      final repo = ref.read(authRepositoryProvider);
      final result = await repo.login(phone: _phoneCtrl.text, password: _passwordCtrl.text);
      await ref.read(authStateProvider.notifier).setAuth(result['user'], result['token']);
      if (mounted) context.go('/dashboard');
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Login failed: ${e.toString()}'), backgroundColor: AppColors.red));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: FadeTransition(
        opacity: _fadeAnim,
        child: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight,
              colors: [Color(0xFF0D0D0F), Color(0xFF1A0A2E), Color(0xFF0D0D0F)],
              stops: [0.0, 0.5, 1.0]),
          ),
          child: SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(28),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 40),
                  // Logo
                  Row(children: [
                    Container(
                      width: 52, height: 52,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(16),
                        gradient: const LinearGradient(colors: [AppColors.primary, AppColors.cyan]),
                      ),
                      child: const Icon(Icons.fitness_center, color: Colors.white, size: 28),
                    ),
                    const SizedBox(width: 14),
                    Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      ShaderMask(
                        shaderCallback: (b) => const LinearGradient(colors: [AppColors.primaryLight, AppColors.cyan]).createShader(b),
                        child: const Text('GymCRM', style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: Colors.white)),
                      ),
                      Text('Sign in to continue', style: TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                    ]),
                  ]),
                  const SizedBox(height: 52),
                  Text('Welcome back', style: TextStyle(fontSize: 32, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
                  const SizedBox(height: 6),
                  Text('Enter your credentials to access the app', style: TextStyle(color: AppColors.textSecondary, fontSize: 15)),
                  const SizedBox(height: 36),
                  // Phone
                  _buildLabel('Phone Number'),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _phoneCtrl,
                    keyboardType: TextInputType.phone,
                    style: const TextStyle(color: AppColors.textPrimary),
                    decoration: InputDecoration(
                      hintText: '+1 234 567 8900',
                      prefixIcon: const Icon(Icons.phone_outlined, color: AppColors.textSecondary, size: 20),
                    ),
                  ),
                  const SizedBox(height: 20),
                  _buildLabel('Password'),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _passwordCtrl,
                    obscureText: _obscure,
                    style: const TextStyle(color: AppColors.textPrimary),
                    decoration: InputDecoration(
                      hintText: '••••••••',
                      prefixIcon: const Icon(Icons.lock_outline, color: AppColors.textSecondary, size: 20),
                      suffixIcon: IconButton(
                        onPressed: () => setState(() => _obscure = !_obscure),
                        icon: Icon(_obscure ? Icons.visibility_off_outlined : Icons.visibility_outlined, color: AppColors.textSecondary, size: 20),
                      ),
                    ),
                  ),
                  const SizedBox(height: 36),
                  // Login button
                  GestureDetector(
                    onTap: _loading ? null : _login,
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      height: 56,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(16),
                        gradient: const LinearGradient(colors: [AppColors.primary, AppColors.cyan]),
                        boxShadow: [BoxShadow(color: AppColors.primary.withOpacity(0.35), blurRadius: 20, offset: const Offset(0, 8))],
                      ),
                      child: Center(
                        child: _loading
                          ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                          : const Text('Sign In', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700)),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  Center(
                    child: GestureDetector(
                      onTap: () => context.push('/auth/register'),
                      child: RichText(text: TextSpan(children: [
                        TextSpan(text: 'Have a code? ', style: TextStyle(color: AppColors.textSecondary)),
                        const TextSpan(text: 'Register', style: TextStyle(color: AppColors.primaryLight, fontWeight: FontWeight.w600)),
                      ])),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLabel(String text) => Text(text, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textSecondary));
}
