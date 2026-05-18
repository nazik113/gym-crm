<?php
namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\{Subscription, User};
use App\Services\NotificationService;
use Illuminate\Http\{JsonResponse, Request};

class SubscriptionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $subs = Subscription::with(['user:id,first_name,last_name,phone', 'plan', 'assignedBy:id,first_name,last_name'])
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->user_id, fn($q) => $q->where('user_id', $request->user_id))
            ->latest()
            ->paginate($request->per_page ?? 20);

        return response()->json($subs);
    }

    public function show(Subscription $subscription): JsonResponse
    {
        $subscription->load(['user:id,first_name,last_name,phone', 'plan', 'assignedBy:id,first_name,last_name']);
        return response()->json($subscription);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'user_id'            => 'required|exists:users,id',
            'plan_id'            => 'required|exists:subscription_plans,id',
            'price_paid'         => 'required|numeric|min:0',
            'sessions_remaining' => 'nullable|integer|min:0',
            'starts_at'          => 'required|date',
            'expires_at'         => 'required|date|after:starts_at',
            'status'             => 'sometimes|in:active,expired,cancelled,frozen',
            'notes'              => 'nullable|string',
        ]);

        $data['assigned_by'] = $request->user()->id;
        $data['status'] = $data['status'] ?? 'active';

        $sub = Subscription::create($data);
        return response()->json($sub->load(['user:id,first_name,last_name', 'plan']), 201);
    }

    public function update(Request $request, Subscription $subscription): JsonResponse
    {
        $data = $request->validate([
            'plan_id'            => 'sometimes|exists:subscription_plans,id',
            'price_paid'         => 'sometimes|numeric|min:0',
            'sessions_remaining' => 'nullable|integer|min:0',
            'starts_at'          => 'sometimes|date',
            'expires_at'         => 'sometimes|date',
            'status'             => 'sometimes|in:active,expired,cancelled,frozen',
            'notes'              => 'nullable|string',
        ]);

        $subscription->update($data);
        return response()->json($subscription->load(['user:id,first_name,last_name', 'plan']));
    }

    public function destroy(Subscription $subscription): JsonResponse
    {
        $subscription->delete();
        return response()->json(['message' => 'Subscription deleted']);
    }

    public function assignToClient(Request $request, User $client): JsonResponse
    {
        $data = $request->validate([
            'plan_id'    => 'required|exists:subscription_plans,id',
            'price_paid' => 'nullable|numeric|min:0',
            'starts_at'  => 'nullable|date',
            'notes'      => 'nullable|string',
        ]);

        $plan = \App\Models\SubscriptionPlan::findOrFail($data['plan_id']);
        $startsAt = $data['starts_at'] ?? today()->toDateString();

        $sub = Subscription::create([
            'user_id'            => $client->id,
            'plan_id'            => $plan->id,
            'assigned_by'        => $request->user()->id,
            'price_paid'         => $data['price_paid'] ?? $plan->price,
            'sessions_remaining' => $plan->sessions_count,
            'starts_at'          => $startsAt,
            'expires_at'         => \Carbon\Carbon::parse($startsAt)->addDays($plan->duration_days),
            'status'             => 'active',
            'notes'              => $data['notes'] ?? null,
        ]);

        NotificationService::notifyClient(
            $client->id,
            "Вам назначен абонемент: {$plan->name}",
            'subscription'
        );

        return response()->json($sub->load(['user:id,first_name,last_name', 'plan']), 201);
    }

    public function extend(Request $request, Subscription $sub): JsonResponse
    {
        $request->validate(['days' => 'required|integer|min:1']);
        $sub->update(['expires_at' => \Carbon\Carbon::parse($sub->expires_at)->addDays($request->days)]);
        return response()->json($sub);
    }

    public function deductSession(Subscription $sub): JsonResponse
    {
        if ($sub->sessions_remaining !== null && $sub->sessions_remaining > 0) {
            $sub->decrement('sessions_remaining');
        }
        $fresh = $sub->fresh();
        NotificationService::notifyClient(
            $sub->user_id,
            'Занятие списано. Осталось: ' . ($fresh->sessions_remaining ?? 0),
            'session'
        );
        return response()->json($fresh);
    }

    public function cancel(Subscription $sub): JsonResponse
    {
        $sub->update(['status' => 'cancelled']);
        return response()->json($sub);
    }
}
