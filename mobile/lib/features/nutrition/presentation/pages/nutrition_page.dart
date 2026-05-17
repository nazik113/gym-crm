import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';
import '../../../../shared/theme/app_theme.dart';
import '../../../../shared/widgets/gym_card.dart';

final nutritionProvider = FutureProvider.autoDispose((ref) async {
  final res = await ref.watch(dioProvider).get('/my/nutrition');
  return res.data['data'] as List<dynamic>;
});

class NutritionPage extends ConsumerWidget {
  const NutritionPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final plans = ref.watch(nutritionProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Nutrition Plans'), centerTitle: false),
      body: plans.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.green)),
        error:   (e, _) => Center(child: Text('Error: $e', style: const TextStyle(color: AppColors.red))),
        data: (list) => list.isEmpty
          ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
              const Icon(Icons.restaurant_menu_rounded, size: 64, color: AppColors.textSecondary),
              const SizedBox(height: 16),
              const Text('No nutrition plans yet', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              Text('Your trainer will create a plan soon', style: TextStyle(color: AppColors.textSecondary)),
            ]))
          : ListView.separated(
              padding: const EdgeInsets.all(20),
              itemCount: list.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (_, i) {
                final plan = list[i] as Map<String, dynamic>;
                return GymCard(borderColor: AppColors.green.withOpacity(0.2),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(plan['title'] ?? '', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                    const SizedBox(height: 12),
                    // Macro chips
                    Row(children: [
                      _MacroChip('${plan['daily_calories'] ?? 0} kcal', AppColors.orange),
                      const SizedBox(width: 8),
                      _MacroChip('P: ${plan['protein_g'] ?? 0}g', AppColors.cyan),
                      const SizedBox(width: 8),
                      _MacroChip('C: ${plan['carbs_g'] ?? 0}g', AppColors.primary),
                      const SizedBox(width: 8),
                      _MacroChip('F: ${plan['fats_g'] ?? 0}g', AppColors.pink),
                    ]),
                    if ((plan['meals'] as List?)?.isNotEmpty ?? false) ...[
                      const SizedBox(height: 16),
                      const Text('Meals', style: TextStyle(fontWeight: FontWeight.w600, color: AppColors.textSecondary, fontSize: 12)),
                      const SizedBox(height: 8),
                      ...((plan['meals'] as List).map((m) => _MealTile(meal: m as Map<String, dynamic>))),
                    ],
                  ]),
                );
              },
            ),
      ),
    );
  }
}

class _MacroChip extends StatelessWidget {
  final String label; final Color color;
  const _MacroChip(this.label, this.color);
  @override Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
    decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(20), border: Border.all(color: color.withOpacity(0.3))),
    child: Text(label, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w600)),
  );
}

class _MealTile extends StatelessWidget {
  final Map<String, dynamic> meal;
  const _MealTile({required this.meal});
  @override Widget build(BuildContext context) => Container(
    margin: const EdgeInsets.only(bottom: 8),
    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
    decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.cardBorder)),
    child: Row(children: [
      const Icon(Icons.restaurant_rounded, color: AppColors.green, size: 18),
      const SizedBox(width: 10),
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(meal['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
        if (meal['time_of_day'] != null) Text(meal['time_of_day'], style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
      ])),
      Text('${meal['calories'] ?? 0} kcal', style: const TextStyle(color: AppColors.orange, fontWeight: FontWeight.w600, fontSize: 13)),
    ]),
  );
}
