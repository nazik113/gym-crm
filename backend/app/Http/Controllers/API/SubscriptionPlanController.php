<?php
namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\SubscriptionPlan;
use Illuminate\Http\{JsonResponse, Request};

class SubscriptionPlanController extends Controller
{
    public function index(): JsonResponse
    {
        $plans = SubscriptionPlan::withCount('subscriptions')->orderBy('price')->get();
        return response()->json(['data' => $plans]);
    }

    public function show(SubscriptionPlan $subscriptionPlan): JsonResponse
    {
        return response()->json($subscriptionPlan->loadCount('subscriptions'));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'           => 'required|string|max:100',
            'description'    => 'nullable|string',
            'price'          => 'required|numeric|min:0',
            'duration_days'  => 'required|integer|min:1',
            'sessions_count' => 'nullable|integer|min:0',
            'is_active'      => 'boolean',
            'color'          => 'nullable|string|max:20',
        ]);

        $plan = SubscriptionPlan::create($data);
        return response()->json($plan, 201);
    }

    public function update(Request $request, SubscriptionPlan $subscriptionPlan): JsonResponse
    {
        $data = $request->validate([
            'name'           => 'sometimes|string|max:100',
            'description'    => 'nullable|string',
            'price'          => 'sometimes|numeric|min:0',
            'duration_days'  => 'sometimes|integer|min:1',
            'sessions_count' => 'nullable|integer|min:0',
            'is_active'      => 'boolean',
            'color'          => 'nullable|string|max:20',
        ]);

        $subscriptionPlan->update($data);
        return response()->json($subscriptionPlan);
    }

    public function destroy(SubscriptionPlan $subscriptionPlan): JsonResponse
    {
        $subscriptionPlan->delete();
        return response()->json(['message' => 'Plan deleted']);
    }
}
