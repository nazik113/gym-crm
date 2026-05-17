import 'package:flutter/material.dart';
import '../../../../shared/theme/app_theme.dart';

class ProfilePage extends StatelessWidget {
  const ProfilePage({super.key});
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: Text('Profile'), centerTitle: false),
    body: const Center(child: Text('Profile module loaded', style: TextStyle(color: AppColors.textPrimary))),
  );
}
