import 'package:flutter/material.dart';
import '../../../../shared/theme/app_theme.dart';

class SubscriptionPage extends StatelessWidget {
  const SubscriptionPage({super.key});
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: Text('Subscription'), centerTitle: false),
    body: const Center(child: Text('Subscription module loaded', style: TextStyle(color: AppColors.textPrimary))),
  );
}
