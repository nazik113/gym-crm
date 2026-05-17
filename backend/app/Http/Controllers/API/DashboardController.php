<?php
namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\{Attendance, Subscription, User};
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $today = today();
        $monthStart = $today->copy()->startOfMonth();

        return response()->json([
            'stats' => [
                'total_clients'         => User::whereHas('role', fn($q) => $q->where('name','client'))->count(),
                'total_trainers'        => User::whereHas('role', fn($q) => $q->where('name','trainer'))->count(),
                'active_subscriptions'  => Subscription::where('status','active')->where('expires_at','>=', $today)->count(),
                'clients_in_gym'        => User::where('is_in_gym', true)->count(),
                'today_attendance'      => Attendance::whereDate('checked_in_at', $today)->count(),
                'month_attendance'      => Attendance::where('checked_in_at','>=', $monthStart)->count(),
                'expiring_soon'         => Subscription::where('status','active')
                    ->whereBetween('expires_at', [$today, $today->copy()->addDays(7)])
                    ->count(),
                'monthly_revenue'       => Subscription::where('created_at','>=', $monthStart)->sum('price_paid'),
            ],
            'attendance_chart'      => $this->attendanceChart(),
            'revenue_chart'         => $this->revenueChart(),
            'top_clients'           => $this->topClients(),
            'expiring_subscriptions'=> $this->expiringSubs(),
            'currently_in_gym'      => User::where('is_in_gym', true)
                ->with('activeSubscription')
                ->limit(10)->get(),
        ]);
    }

    public function stats(): JsonResponse
    {
        return response()->json([
            'weekly_attendance'  => $this->attendanceChart(7),
            'monthly_attendance' => $this->attendanceChart(30),
            'revenue_by_plan'    => $this->revenueByPlan(),
            'trainer_stats'      => $this->trainerStats(),
        ]);
    }

    private function attendanceChart(int $days = 30): array
    {
        return Attendance::select(
                DB::raw('DATE(checked_in_at) as date'),
                DB::raw('COUNT(*) as count')
            )
            ->where('checked_in_at', '>=', now()->subDays($days))
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(fn($r) => ['date' => $r->date, 'count' => $r->count])
            ->toArray();
    }

    private function revenueChart(): array
    {
        return Subscription::select(
                DB::raw("TO_CHAR(created_at,'YYYY-MM') as month"),
                DB::raw('SUM(price_paid) as revenue')
            )
            ->where('created_at', '>=', now()->subMonths(6))
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->map(fn($r) => ['month' => $r->month, 'revenue' => (float)$r->revenue])
            ->toArray();
    }

    private function revenueByPlan(): array
    {
        return Subscription::select('plan_id', DB::raw('SUM(price_paid) as revenue'), DB::raw('COUNT(*) as count'))
            ->with('plan:id,name,color')
            ->groupBy('plan_id')
            ->get()
            ->map(fn($r) => ['plan' => $r->plan?->name, 'color' => $r->plan?->color, 'revenue' => (float)$r->revenue, 'count' => $r->count])
            ->toArray();
    }

    private function topClients(): array
    {
        return User::whereHas('role', fn($q) => $q->where('name','client'))
            ->withCount(['attendance as visits_this_month' => fn($q) =>
                $q->where('checked_in_at','>=', today()->startOfMonth())])
            ->orderByDesc('visits_this_month')
            ->limit(5)
            ->get(['id','first_name','last_name','avatar'])
            ->toArray();
    }

    private function expiringSubs(): array
    {
        return Subscription::with('user:id,first_name,last_name,avatar')
            ->where('status','active')
            ->where('expires_at','>=', today())
            ->where('expires_at','<=', today()->addDays(7))
            ->orderBy('expires_at')
            ->limit(8)
            ->get()
            ->toArray();
    }

    private function trainerStats(): array
    {
        return User::whereHas('role', fn($q) => $q->where('name','trainer'))
            ->withCount('clients')
            ->with(['clients' => fn($q) => $q->withCount(['attendance as this_month' =>
                fn($a) => $a->where('checked_in_at','>=', today()->startOfMonth())])])
            ->get(['id','first_name','last_name','avatar'])
            ->toArray();
    }
}
