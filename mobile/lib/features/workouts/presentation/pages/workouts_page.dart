import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';
import '../../../../shared/theme/app_theme.dart';
import '../../../../shared/widgets/gym_card.dart';

final workoutsProvider = FutureProvider.autoDispose((ref) async {
  final dio = ref.watch(dioProvider);
  final res  = await dio.get('/my/workouts');
  return res.data['data'] as List<dynamic>;
});

class WorkoutsPage extends ConsumerWidget {
  const WorkoutsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final plans = ref.watch(workoutsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('My Workouts'), centerTitle: false),
      body: plans.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
        error: (e, _) => Center(child: Text('Error: $e', style: const TextStyle(color: AppColors.red))),
        data: (list) => list.isEmpty
          ? _emptyState()
          : ListView.separated(
              padding: const EdgeInsets.all(20),
              itemCount: list.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (_, i) {
                final plan = list[i] as Map<String, dynamic>;
                return GymCard(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Row(children: [
                      Container(width: 8, height: 8, decoration: BoxDecoration(color: _statusColor(plan['status']), shape: BoxShape.circle)),
                      const SizedBox(width: 8),
                      Expanded(child: Text(plan['title'] ?? '', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16))),
                      Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(color: _statusColor(plan['status']).withOpacity(0.12), borderRadius: BorderRadius.circular(20)),
                        child: Text(plan['status'] ?? '', style: TextStyle(color: _statusColor(plan['status']), fontSize: 11, fontWeight: FontWeight.w600))),
                    ]),
                    if (plan['description'] != null) ...[
                      const SizedBox(height: 8),
                      Text(plan['description'], style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                    ],
                    const SizedBox(height: 16),
                    const Text('Training Days', style: TextStyle(fontWeight: FontWeight.w600, color: AppColors.textSecondary, fontSize: 12)),
                    const SizedBox(height: 8),
                    ...((plan['days'] as List? ?? []).map((d) => _DayTile(day: d as Map<String, dynamic>))),
                  ]),
                );
              },
            ),
      ),
    );
  }

  Color _statusColor(String? s) => s == 'active' ? AppColors.green : s == 'completed' ? AppColors.cyan : AppColors.orange;

  Widget _emptyState() => Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
    const Icon(Icons.fitness_center_rounded, size: 64, color: AppColors.textSecondary),
    const SizedBox(height: 16),
    const Text('No workout plans yet', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
    const SizedBox(height: 8),
    Text('Your trainer will assign plans soon', style: TextStyle(color: AppColors.textSecondary)),
  ]));
}

class _DayTile extends StatelessWidget {
  final Map<String, dynamic> day;
  const _DayTile({required this.day});

  @override
  Widget build(BuildContext context) => Container(
    margin: const EdgeInsets.only(bottom: 8),
    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
    decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.cardBorder)),
    child: Row(children: [
      Container(width: 32, height: 32, decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.15), borderRadius: BorderRadius.circular(8)),
        child: Center(child: Text('${day['day_number']}', style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.primaryLight, fontSize: 13)))),
      const SizedBox(width: 12),
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(day['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
        if (day['muscle_groups'] != null) Text(day['muscle_groups'], style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
      ])),
      Text('${(day['exercises'] as List?)?.length ?? 0} ex.', style: const TextStyle(color: AppColors.cyan, fontSize: 12, fontWeight: FontWeight.w600)),
    ]),
  );
}
