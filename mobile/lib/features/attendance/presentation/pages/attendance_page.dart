import 'package:flutter/material.dart';
import '../../../../shared/theme/app_theme.dart';

class AttendancePage extends StatelessWidget {
  const AttendancePage({super.key});
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: Text('Attendance'), centerTitle: false),
    body: const Center(child: Text('Attendance module loaded', style: TextStyle(color: AppColors.textPrimary))),
  );
}
