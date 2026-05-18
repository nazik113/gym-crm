<?php
namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\{Role, User};
use Illuminate\Http\{JsonResponse, Request};
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class TrainerController extends Controller
{
    private function trainerRole(): int
    {
        return Role::where('name', 'trainer')->first()->id;
    }

    public function index(Request $request): JsonResponse
    {
        $trainers = User::where('role_id', $this->trainerRole())
            ->with('role')
            ->withCount('clients')
            ->when($request->search, fn($q) => $q->where(function ($q) use ($request) {
                $q->where('first_name', 'ilike', "%{$request->search}%")
                  ->orWhere('last_name', 'ilike', "%{$request->search}%")
                  ->orWhere('phone', 'ilike', "%{$request->search}%");
            }))
            ->orderBy('first_name')
            ->paginate($request->per_page ?? 20);

        return response()->json($trainers);
    }

    public function show(User $trainer): JsonResponse
    {
        $trainer->load('role')->loadCount('clients');
        return response()->json($trainer);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'phone'         => 'required|string|unique:users',
            'first_name'    => 'required|string|max:100',
            'last_name'     => 'required|string|max:100',
            'date_of_birth' => 'nullable|date',
            'password'      => 'required|string|min:6',
            'is_active'     => 'boolean',
        ]);

        $trainer = User::create([
            ...$data,
            'role_id'  => $this->trainerRole(),
            'password' => Hash::make($data['password']),
            'qr_code'  => 'QR-' . strtoupper(uniqid()),
        ]);

        return response()->json($trainer->load('role'), 201);
    }

    public function update(Request $request, User $trainer): JsonResponse
    {
        $data = $request->validate([
            'phone'         => 'sometimes|string|unique:users,phone,' . $trainer->id,
            'first_name'    => 'sometimes|string|max:100',
            'last_name'     => 'sometimes|string|max:100',
            'date_of_birth' => 'nullable|date',
            'is_active'     => 'boolean',
            'notes'         => 'nullable|string',
        ]);

        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $trainer->update($data);
        return response()->json($trainer->load('role'));
    }

    public function destroy(User $trainer): JsonResponse
    {
        $trainer->delete();
        return response()->json(['message' => 'Trainer deleted']);
    }

    public function assignClient(Request $request, User $trainer): JsonResponse
    {
        $request->validate(['client_id' => 'required|exists:users,id']);
        User::findOrFail($request->client_id)->update(['trainer_id' => $trainer->id]);
        return response()->json(['message' => 'Client assigned to trainer']);
    }

    public function myClients(Request $request): JsonResponse
    {
        $clients = $request->user()->clients()
            ->with(['role', 'activeSubscription.plan'])
            ->withCount('attendance')
            ->orderBy('first_name')
            ->get();

        return response()->json(['data' => $clients]);
    }

    public function myProfile(Request $request): JsonResponse
    {
        $user = $request->user()
            ->load('role')
            ->loadCount('clients');

        return response()->json($user);
    }

    public function updateMyProfile(Request $request): JsonResponse
    {
        $data = $request->validate([
            'first_name'    => 'sometimes|string|max:100',
            'last_name'     => 'sometimes|string|max:100',
            'date_of_birth' => 'nullable|date',
        ]);

        $request->user()->update($data);

        return response()->json($request->user()->fresh()->load('role')->loadCount('clients'));
    }

    public function uploadAvatar(Request $request): JsonResponse
    {
        $request->validate(['avatar' => 'required|image|max:2048']);

        $user = $request->user();
        $path = $request->file('avatar')->store('avatars', 'public');
        $user->update(['avatar' => '/storage/' . $path]);

        return response()->json(['avatar' => $user->avatar]);
    }
}
