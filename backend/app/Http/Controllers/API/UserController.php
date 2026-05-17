<?php
namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\{Role, User};
use Illuminate\Http\{JsonResponse, Request};
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $users = User::with('role')
            ->when($request->role, fn($q) => $q->whereHas('role', fn($r) => $r->where('name', $request->role)))
            ->when($request->search, fn($q) => $q->where(function ($q) use ($request) {
                $q->where('first_name', 'ilike', "%{$request->search}%")
                  ->orWhere('last_name', 'ilike', "%{$request->search}%")
                  ->orWhere('phone', 'ilike', "%{$request->search}%");
            }))
            ->when($request->is_active !== null, fn($q) => $q->where('is_active', $request->boolean('is_active')))
            ->orderBy('first_name')
            ->paginate($request->per_page ?? 20);

        return response()->json($users);
    }

    public function show(User $user): JsonResponse
    {
        $user->load(['role', 'trainer:id,first_name,last_name', 'activeSubscription.plan']);
        return response()->json($user);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'role_id'       => 'required|exists:roles,id',
            'phone'         => 'required|string|unique:users',
            'first_name'    => 'required|string|max:100',
            'last_name'     => 'required|string|max:100',
            'date_of_birth' => 'nullable|date',
            'password'      => 'required|string|min:6',
            'trainer_id'    => 'nullable|exists:users,id',
            'is_active'     => 'boolean',
        ]);

        $user = User::create([
            ...$data,
            'password' => Hash::make($data['password']),
            'qr_code'  => 'QR-' . strtoupper(uniqid()),
        ]);

        return response()->json($user->load('role'), 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'role_id'       => 'sometimes|exists:roles,id',
            'phone'         => 'sometimes|string|unique:users,phone,' . $user->id,
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

        $user->update($data);
        return response()->json($user->load(['role', 'trainer:id,first_name,last_name']));
    }

    public function destroy(User $user): JsonResponse
    {
        $user->delete();
        return response()->json(['message' => 'User deleted']);
    }

    public function toggleActive(User $user): JsonResponse
    {
        $user->update(['is_active' => !$user->is_active]);
        return response()->json(['is_active' => $user->is_active, 'message' => $user->is_active ? 'User activated' : 'User deactivated']);
    }
}
