<?php
namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\{Attendance, Subscription, User};
use Illuminate\Http\{JsonResponse, Request};
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    public function revenue(Request $request): JsonResponse
    {
        $months = $request->months ?? 12;

        $monthly = Subscription::select(
                DB::raw("TO_CHAR(created_at, 'YYYY-MM') as month"),
                DB::raw('SUM(price_paid) as revenue'),
                DB::raw('COUNT(*) as count')
            )
            ->where('created_at', '>=', now()->subMonths($months))
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->map(fn($r) => ['month' => $r->month, 'revenue' => (float) $r->revenue, 'count' => $r->count]);

        $byPlan = Subscription::select('plan_id', DB::raw('SUM(price_paid) as revenue'), DB::raw('COUNT(*) as count'))
            ->with('plan:id,name,color')
            ->where('created_at', '>=', now()->subMonths($months))
            ->groupBy('plan_id')
            ->get()
            ->map(fn($r) => [
                'plan'    => $r->plan?->name,
                'color'   => $r->plan?->color,
                'revenue' => (float) $r->revenue,
                'count'   => $r->count,
            ]);

        return response()->json([
            'data' => [
                'monthly'     => $monthly,
                'by_plan'     => $byPlan,
                'total'       => Subscription::where('created_at', '>=', now()->subMonths($months))->sum('price_paid'),
                'this_month'  => Subscription::where('created_at', '>=', now()->startOfMonth())->sum('price_paid'),
            ],
        ]);
    }

    public function attendance(Request $request): JsonResponse
    {
        $days = $request->days ?? 30;

        $daily = Attendance::select(
                DB::raw('DATE(checked_in_at) as date'),
                DB::raw('COUNT(*) as count'),
                DB::raw('AVG(duration_minutes) as avg_duration')
            )
            ->where('checked_in_at', '>=', now()->subDays($days))
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(fn($r) => ['date' => $r->date, 'count' => $r->count, 'avg_duration' => round($r->avg_duration)]);

        $byHour = Attendance::select(
                DB::raw('EXTRACT(HOUR FROM checked_in_at) as hour'),
                DB::raw('COUNT(*) as count')
            )
            ->where('checked_in_at', '>=', now()->subDays($days))
            ->groupBy('hour')
            ->orderBy('hour')
            ->get()
            ->map(fn($r) => ['hour' => (int) $r->hour, 'count' => $r->count]);

        return response()->json([
            'data' => [
                'daily'        => $daily,
                'by_hour'      => $byHour,
                'total'        => Attendance::where('checked_in_at', '>=', now()->subDays($days))->count(),
                'today'        => Attendance::whereDate('checked_in_at', today())->count(),
                'in_gym_now'   => User::where('is_in_gym', true)->count(),
            ],
        ]);
    }

    public function subscriptions(Request $request): JsonResponse
    {
        $today = today();

        $statusCounts = Subscription::select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')
            ->get()
            ->pluck('count', 'status');

        $expiringSoon = Subscription::where('status', 'active')
            ->where('expires_at', '>=', $today)
            ->where('expires_at', '<=', $today->copy()->addDays(7))
            ->with('user:id,first_name,last_name,phone')
            ->orderBy('expires_at')
            ->get();

        return response()->json([
            'data' => [
                'status_counts'  => $statusCounts,
                'active'         => $statusCounts['active'] ?? 0,
                'expired'        => $statusCounts['expired'] ?? 0,
                'cancelled'      => $statusCounts['cancelled'] ?? 0,
                'expiring_soon'  => $expiringSoon,
            ],
        ]);
    }

    public function clients(Request $request): JsonResponse
    {
        $topVisitors = User::whereHas('role', fn($q) => $q->where('name', 'client'))
            ->withCount(['attendance as visits_this_month' => fn($q) =>
                $q->where('checked_in_at', '>=', today()->startOfMonth())])
            ->orderByDesc('visits_this_month')
            ->limit(10)
            ->get(['id', 'first_name', 'last_name', 'avatar']);

        $newThisMonth = User::whereHas('role', fn($q) => $q->where('name', 'client'))
            ->where('created_at', '>=', now()->startOfMonth())
            ->count();

        $total = User::whereHas('role', fn($q) => $q->where('name', 'client'))->count();
        $active = User::whereHas('role', fn($q) => $q->where('name', 'client'))
            ->where('is_active', true)->count();

        return response()->json([
            'data' => [
                'total'          => $total,
                'active'         => $active,
                'new_this_month' => $newThisMonth,
                'top_visitors'   => $topVisitors,
            ],
        ]);
    }

    public function trainers(Request $request): JsonResponse
    {
        $trainers = User::whereHas('role', fn($q) => $q->where('name', 'trainer'))
            ->withCount('clients')
            ->with(['clients' => fn($q) => $q->withCount(['attendance as this_month_visits' =>
                fn($a) => $a->where('checked_in_at', '>=', today()->startOfMonth())])])
            ->get(['id', 'first_name', 'last_name', 'avatar']);

        return response()->json(['data' => $trainers]);
    }
}
