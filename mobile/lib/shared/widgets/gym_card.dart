import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class GymCard extends StatelessWidget {
  final Widget child;
  final EdgeInsets? padding;
  final Color? borderColor;
  const GymCard({super.key, required this.child, this.padding, this.borderColor});

  @override
  Widget build(BuildContext context) => Container(
    width: double.infinity,
    decoration: BoxDecoration(
      color: AppColors.card,
      borderRadius: BorderRadius.circular(20),
      border: Border.all(color: borderColor ?? AppColors.cardBorder),
    ),
    padding: padding ?? const EdgeInsets.all(20),
    child: child,
  );
}
