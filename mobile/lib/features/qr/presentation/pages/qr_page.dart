import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../../../core/providers/auth_provider.dart';
import '../../../../shared/theme/app_theme.dart';
import '../../../../shared/widgets/gym_card.dart';

class QRPage extends ConsumerWidget {
  const QRPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authStateProvider).user;
    final qrCode = user?.qrCode ?? '';

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter,
            colors: [Color(0xFF1A0A2E), AppColors.background]),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                const SizedBox(height: 16),
                const Text('My QR Code', style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: AppColors.textPrimary)),
                const SizedBox(height: 6),
                const Text('Show this to check in at the gym', style: TextStyle(color: AppColors.textSecondary)),
                const SizedBox(height: 40),

                // QR Card with glow
                Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(28),
                    boxShadow: [BoxShadow(color: AppColors.primary.withOpacity(0.4), blurRadius: 40, spreadRadius: 2)],
                  ),
                  child: GymCard(
                    borderColor: AppColors.primary.withOpacity(0.4),
                    padding: const EdgeInsets.all(28),
                    child: Column(children: [
                      // Avatar
                      CircleAvatar(
                        radius: 32,
                        backgroundColor: AppColors.primary,
                        child: Text('${user?.firstName[0] ?? '?'}${user?.lastName[0] ?? ''}',
                          style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w800)),
                      ),
                      const SizedBox(height: 12),
                      Text('${user?.firstName} ${user?.lastName}',
                        style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 18, color: AppColors.textPrimary)),
                      const SizedBox(height: 4),
                      Text(user?.phone ?? '', style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                      const SizedBox(height: 28),

                      // QR Code
                      if (qrCode.isNotEmpty)
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
                          child: QrImageView(
                            data: qrCode,
                            version: QrVersions.auto,
                            size: 200,
                            backgroundColor: Colors.white,
                            eyeStyle: const QrEyeStyle(eyeShape: QrEyeShape.square, color: Colors.black),
                            dataModuleStyle: const QrDataModuleStyle(dataModuleShape: QrDataModuleShape.square, color: Colors.black),
                          ),
                        )
                      else
                        const SizedBox(height: 200, child: Center(child: CircularProgressIndicator(color: AppColors.primary))),

                      const SizedBox(height: 20),
                      // Code text
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                        decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.12), borderRadius: BorderRadius.circular(30), border: Border.all(color: AppColors.primary.withOpacity(0.3))),
                        child: Text(qrCode, style: const TextStyle(fontFamily: 'monospace', fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.primaryLight, letterSpacing: 3)),
                      ),
                    ]),
                  ),
                ),

                const SizedBox(height: 28),

                // Actions
                Row(children: [
                  Expanded(
                    child: _ActionButton(
                      icon: Icons.copy_rounded,
                      label: 'Copy Code',
                      color: AppColors.primary,
                      onTap: () {
                        Clipboard.setData(ClipboardData(text: qrCode));
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Code copied!'), backgroundColor: AppColors.green, duration: Duration(seconds: 2)));
                      },
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _ActionButton(
                      icon: Icons.fullscreen_rounded,
                      label: 'Fullscreen',
                      color: AppColors.cyan,
                      onTap: () => showDialog(context: context, builder: (_) => _FullscreenQR(qrCode: qrCode)),
                    ),
                  ),
                ]),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  final IconData icon; final String label; final Color color; final VoidCallback onTap;
  const _ActionButton({required this.icon, required this.label, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      height: 52,
      decoration: BoxDecoration(color: color.withOpacity(0.12), borderRadius: BorderRadius.circular(16), border: Border.all(color: color.withOpacity(0.3))),
      child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
        Icon(icon, color: color, size: 20),
        const SizedBox(width: 8),
        Text(label, style: TextStyle(color: color, fontWeight: FontWeight.w600)),
      ]),
    ),
  );
}

class _FullscreenQR extends StatelessWidget {
  final String qrCode;
  const _FullscreenQR({required this.qrCode});

  @override
  Widget build(BuildContext context) => Dialog.fullscreen(
    backgroundColor: AppColors.background,
    child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
      Container(
        margin: const EdgeInsets.all(32),
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24),
          boxShadow: [BoxShadow(color: AppColors.primary.withOpacity(0.5), blurRadius: 60)]),
        child: QrImageView(data: qrCode, version: QrVersions.auto, size: 280, backgroundColor: Colors.white),
      ),
      Text(qrCode, style: const TextStyle(fontFamily: 'monospace', fontSize: 22, fontWeight: FontWeight.w700, color: AppColors.primaryLight, letterSpacing: 4)),
      const SizedBox(height: 40),
      TextButton.icon(onPressed: () => Navigator.pop(context), icon: const Icon(Icons.close), label: const Text('Close'), style: TextButton.styleFrom(foregroundColor: AppColors.textSecondary)),
    ]),
  );
}
