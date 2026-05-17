import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/providers/auth_provider.dart';
import '../../../../shared/theme/app_theme.dart';
import '../../data/repositories/auth_repository.dart';

class RegisterPage extends ConsumerStatefulWidget {
  const RegisterPage({super.key});
  @override ConsumerState<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends ConsumerState<RegisterPage> with TickerProviderStateMixin {
  int _step = 0;
  String _validCode = '';
  bool _loading = false;

  final _codeCtrl       = TextEditingController();
  final _phoneCtrl      = TextEditingController();
  final _firstNameCtrl  = TextEditingController();
  final _lastNameCtrl   = TextEditingController();
  final _dobCtrl        = TextEditingController();
  final _passwordCtrl   = TextEditingController();

  late AnimationController _animCtrl;
  late Animation<Offset> _slideAnim;

  @override
  void initState() {
    super.initState();
    _animCtrl  = AnimationController(vsync: this, duration: const Duration(milliseconds: 400));
    _slideAnim = Tween<Offset>(begin: const Offset(1, 0), end: Offset.zero)
        .animate(CurvedAnimation(parent: _animCtrl, curve: Curves.easeOutCubic));
    _animCtrl.forward();
  }
  @override void dispose() { _animCtrl.dispose(); super.dispose(); }

  Future<void> _validateCode() async {
    if (_codeCtrl.text.isEmpty) return;
    setState(() => _loading = true);
    try {
      final repo = ref.read(authRepositoryProvider);
      await repo.validateCode(_codeCtrl.text);
      _validCode = _codeCtrl.text;
      _animCtrl.reverse().then((_) {
        setState(() => _step = 1);
        _animCtrl.forward();
      });
    } catch (e) {
      _showError('Invalid or expired code');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _register() async {
    setState(() => _loading = true);
    try {
      final repo = ref.read(authRepositoryProvider);
      final result = await repo.register({
        'code': _validCode,
        'phone': _phoneCtrl.text,
        'first_name': _firstNameCtrl.text,
        'last_name': _lastNameCtrl.text,
        'date_of_birth': _dobCtrl.text.isNotEmpty ? _dobCtrl.text : null,
        'password': _passwordCtrl.text,
        'password_confirmation': _passwordCtrl.text,
      });
      await ref.read(authStateProvider.notifier).setAuth(result['user'], result['token']);
      if (mounted) context.go('/dashboard');
    } catch (e) {
      _showError('Registration failed');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), backgroundColor: AppColors.red));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight,
            colors: [Color(0xFF0D0D0F), Color(0xFF0A1A2E), Color(0xFF0D0D0F)]),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(28),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Back
                IconButton(onPressed: () { if (_step > 0) { setState(() => _step = 0); } else { context.pop(); } },
                  icon: const Icon(Icons.arrow_back_ios, color: AppColors.textPrimary, size: 20)),
                const SizedBox(height: 16),
                // Progress
                Row(children: List.generate(2, (i) => Expanded(
                  child: Container(
                    margin: EdgeInsets.only(right: i < 1 ? 6 : 0),
                    height: 3,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(2),
                      color: i <= _step ? AppColors.primary : AppColors.cardBorder,
                    ),
                  ),
                ))),
                const SizedBox(height: 32),
                SlideTransition(
                  position: _slideAnim,
                  child: _step == 0 ? _buildCodeStep() : _buildRegisterStep(),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildCodeStep() => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      const Text('Invitation Code', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
      const SizedBox(height: 8),
      Text('Enter the code you received from your gym', style: TextStyle(color: AppColors.textSecondary, fontSize: 15)),
      const SizedBox(height: 36),
      TextField(
        controller: _codeCtrl,
        textCapitalization: TextCapitalization.characters,
        style: const TextStyle(color: AppColors.primaryLight, fontFamily: 'monospace', letterSpacing: 4, fontSize: 20, fontWeight: FontWeight.w700),
        decoration: const InputDecoration(hintText: 'XXXXXXXXXX', prefixIcon: Icon(Icons.key_outlined, color: AppColors.textSecondary)),
      ),
      const SizedBox(height: 32),
      _buildGradientButton('Verify Code', _loading ? null : _validateCode),
    ],
  );

  Widget _buildRegisterStep() => Expanded(
    child: SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Create Account', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
          const SizedBox(height: 8),
          Text('Complete your profile to get started', style: TextStyle(color: AppColors.textSecondary)),
          const SizedBox(height: 32),
          Row(children: [
            Expanded(child: _buildField('First Name', _firstNameCtrl)),
            const SizedBox(width: 12),
            Expanded(child: _buildField('Last Name', _lastNameCtrl)),
          ]),
          const SizedBox(height: 16),
          _buildField('Phone Number', _phoneCtrl, type: TextInputType.phone),
          const SizedBox(height: 16),
          _buildField('Date of Birth', _dobCtrl, hint: 'YYYY-MM-DD'),
          const SizedBox(height: 16),
          _buildField('Password', _passwordCtrl, obscure: true),
          const SizedBox(height: 32),
          _buildGradientButton('Create Account', _loading ? null : _register),
        ],
      ),
    ),
  );

  Widget _buildField(String label, TextEditingController ctrl, {TextInputType? type, bool obscure = false, String? hint}) =>
    Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
      const SizedBox(height: 8),
      TextField(controller: ctrl, keyboardType: type, obscureText: obscure,
        style: const TextStyle(color: AppColors.textPrimary),
        decoration: InputDecoration(hintText: hint ?? label),
      ),
    ]);

  Widget _buildGradientButton(String label, VoidCallback? onTap) => GestureDetector(
    onTap: onTap,
    child: Container(
      width: double.infinity, height: 56,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        gradient: onTap == null ? null : const LinearGradient(colors: [AppColors.primary, AppColors.cyan]),
        color: onTap == null ? AppColors.card : null,
        boxShadow: onTap != null ? [BoxShadow(color: AppColors.primary.withOpacity(0.35), blurRadius: 20, offset: const Offset(0, 8))] : null,
      ),
      child: Center(
        child: _loading
          ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
          : Text(label, style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700)),
      ),
    ),
  );
}
