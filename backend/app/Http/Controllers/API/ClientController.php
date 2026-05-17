<?php
namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\{Role, User};
use Illuminate\Http\{JsonResponse, Request};
use Illuminate\Support\Facades\Hash;

class ClientController extends Controller
{
    private function clientRole(): int
    {
        return Role::where('name', 'client')->first()->id;
    }

    public function index(Request $request): JsonResponse
    {
        $clients = User::where('role_id', $this->clientRole())
            ->with(['role', 'trainer:id,first_name,last_name', 'activeSubscription.plan'])
            ->when($request->search, fn($q) => $q->where(function ($q) use ($request) {
                $q->where('first_name', 'ilike', "%{$request->search}%")
                  ->orWhere('last_name', 'ilike', "%{$request->search}%")
                  ->orWhere('phone', 'ilike', "%{$request->search}%");
            }))
            ->when($request->trainer_id, fn($q) => $q->where('trainer_id', $request->trainer_id))
            ->when($request->is_active !== null, fn($q) => $q->where('is_active', $request->boolean('is_active')))
            ->orderBy('first_name')
            ->paginate($request->per_page ?? 20);

        return response()->json($clients);
    }

    public function show(User $client): JsonResponse
    {
        $client->load(['role', 'trainer:id,first_name,last_name', 'activeSubscription.plan', 'measurements' => fn($q) => $q->latest()->limit(1)]);
        return response()->json($client);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'phone'         => 'required|string|unique:users',
            'first_name'    => 'required|string|max:100',
            'last_name'     => 'required|string|max:100',
            'date_of_birth' => 'nullable|date',
            'password'      => 'required|string|min:6',
            'trainer_id'    => 'nullable|exists:users,id',
            'is_active'     => 'boolean',
        ]);

        $client = User::create([
            ...$data,
            'role_id'  => $this->clientRole(),
            'password' => Hash::make($data['password']),
            'qr_code'  => 'QR-' . strtoupper(uniqid()),
        ]);

        return response()->json($client->load('role'), 201);
    }

    public function update(Request $request, User $client): JsonResponse
    {
        $data = $request->validate([
            'phone'         => 'sometimes|string|unique:users,phone,' . $client->id,
            'first_name'    => 'sometimes|string|max:100',
            'last_name'     => 'sometimes|string|max:100',
            'date_of_birth' => 'nullable|date',
            'trainer_id'    => 'nullable|exists:users,id',
            'is_active'     => 'boolean',
            'notes'         => 'nullable|string',
        ]);

        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $client->update($data);
        return response()->json($client->load(['role', 'trainer:id,first_name,last_name']));
    }

    public function destroy(User $client): JsonResponse
    {
        $client->delete();
        return response()->json(['message' => 'Client deleted']);
    }

    public function subscription(User $client): JsonResponse
    {
        $subscriptions = $client->subscriptions()->with('plan', 'assignedBy:id,first_name,last_name')->latest()->get();
        return response()->json(['data' => $subscriptions]);
    }

    public function attendance(User $client): JsonResponse
    {
        $attendance = $client->attendance()->with('subscription.plan')->latest('checked_in_at')->paginate(30);
        return response()->json($attendance);
    }

    public function myProfile(Request $request): JsonResponse
    {
        $user = $request->user()->load(['role', 'trainer:id,first_name,last_name', 'activeSubscription.plan']);
        return response()->json($user);
    }

    public function mySubscription(Request $request): JsonResponse
    {
        $subscriptions = $request->user()->subscriptions()->with('plan')->latest()->get();
        return response()->json(['data' => $subscriptions]);
    }

    public function myAttendance(Request $request): JsonResponse
    {
        $attendance = $request->user()->attendance()->with('subscription.plan')->latest('checked_in_at')->paginate(30);
        return response()->json($attendance);
    }
}
