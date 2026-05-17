<?php
namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\RegistrationCode;
use App\Models\User;
use App\Services\AuthService;
use App\Services\QRService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(
        private readonly AuthService $authService,
        private readonly QRService $qrService,
    ) {}

    public function login(LoginRequest $request): JsonResponse
    {
        $result = $this->authService->login(
            phone: $request->phone,
            password: $request->password
        );

        if (!$result) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        return response()->json($result);
    }

    public function validateCode(Request $request): JsonResponse
    {
        $request->validate(['code' => 'required|string']);

        $code = RegistrationCode::where('code', $request->code)
            ->where('status', 'active')
            ->with('role', 'subscriptionPlan')
            ->first();

        if (!$code) {
            return response()->json(['message' => 'Invalid or expired code'], 422);
        }

        if ($code->expires_at && $code->expires_at->isPast()) {
            $code->update(['status' => 'expired']);
            return response()->json(['message' => 'Code has expired'], 422);
        }

        return response()->json([
            'valid' => true,
            'role' => $code->role->name,
            'code' => $code->code,
            // Never expose hidden fields to client
        ]);
    }

    public function register(RegisterRequest $request): JsonResponse
    {
        $code = RegistrationCode::where('code', $request->code)
            ->where('status', 'active')
            ->lockForUpdate()
            ->firstOrFail();

        $user = $this->authService->register($request->validated(), $code);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => $user->load('role'),
            'token' => $token,
            'token_type' => 'Bearer',
        ], 201);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully']);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json($request->user()->load('role', 'trainer', 'activeSubscription'));
    }

    public function refresh(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();
        $token = $request->user()->createToken('auth_token')->plainTextToken;
        return response()->json(['token' => $token, 'token_type' => 'Bearer']);
    }
}
