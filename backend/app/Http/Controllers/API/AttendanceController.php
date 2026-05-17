<?php
namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use Illuminate\Http\{JsonResponse, Request};

class AttendanceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $attendance = Attendance::with([
                'user:id,first_name,last_name,phone',
                'subscription.plan',
                'checkedInBy:id,first_name,last_name',
            ])
            ->when($request->user_id, fn($q) => $q->where('user_id', $request->user_id))
            ->when($request->date, fn($q) => $q->whereDate('checked_in_at', $request->date))
            ->when($request->from, fn($q) => $q->where('checked_in_at', '>=', $request->from))
            ->when($request->to, fn($q) => $q->where('checked_in_at', '<=', $request->to))
            ->latest('checked_in_at')
            ->paginate($request->per_page ?? 30);

        return response()->json($attendance);
    }

    public function show(Attendance $attendance): JsonResponse
    {
        $attendance->load(['user:id,first_name,last_name,phone', 'subscription.plan', 'checkedInBy:id,first_name,last_name']);
        return response()->json($attendance);
    }
}
