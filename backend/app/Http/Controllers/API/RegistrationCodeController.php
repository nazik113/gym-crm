<?php
namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\{RegistrationCode, SubscriptionPlan};
use Illuminate\Http\{JsonResponse, Request};
use Illuminate\Support\Str;

class RegistrationCodeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $codes = RegistrationCode::with(['role', 'subscriptionPlan', 'createdBy', 'activatedBy'])
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->role,   fn($q) => $q->whereHas('role', fn($r) => $r->where('name', $request->role)))
            ->latest()
            ->paginate(20);
        return response()->json($codes);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'role_id'              => 'required|exists:roles,id',
            'hidden_first_name'    => 'nullable|string|max:100',
            'hidden_last_name'     => 'nullable|string|max:100',
            'hidden_phone'         => 'nullable|string|max:20',
            'subscription_plan_id' => 'nullable|exists:subscription_plans,id',
            'expires_at'           => 'nullable|date|after:now',
        ]);

        $code = RegistrationCode::create([
            ...$data,
            'code'       => strtoupper(Str::random(10)),
            'created_by' => auth()->id(),
            'status'     => 'active',
        ]);

        return response()->json($code->load('role', 'subscriptionPlan'), 201);
    }

    public function destroy(RegistrationCode $registrationCode): JsonResponse
    {
        abort_if($registrationCode->status === 'used', 422, 'Cannot delete an activated code.');
        $registrationCode->delete();
        return response()->json(['message' => 'Code deleted']);
    }

    public function revoke(RegistrationCode $code): JsonResponse
    {
        abort_if($code->status === 'used', 422, 'Cannot revoke an activated code.');
        $code->update(['status' => 'revoked']);
        return response()->json(['message' => 'Code revoked', 'code' => $code]);
    }
}
