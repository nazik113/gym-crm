<?php
namespace App\Services;

use App\Models\{RegistrationCode, Subscription, User};
use Illuminate\Support\Facades\{Hash, DB};
use Carbon\Carbon;

class AuthService
{
    public function __construct(private readonly QRService $qrService) {}

    public function login(string $phone, string $password): ?array
    {
        $user = User::where('phone', $phone)->where('is_active', true)->first();
        if (!$user || !Hash::check($password, $user->password)) return null;

        $user->tokens()->delete();
        $token = $user->createToken('auth_token')->plainTextToken;

        return [
            'user'       => $user->load('role', 'trainer', 'activeSubscription'),
            'token'      => $token,
            'token_type' => 'Bearer',
        ];
    }

    public function register(array $data, RegistrationCode $code): User
    {
        return DB::transaction(function () use ($data, $code) {
            $user = User::create([
                'role_id'       => $code->role_id,
                'phone'         => $data['phone'],
                'first_name'    => $data['first_name'],
                'last_name'     => $data['last_name'],
                'date_of_birth' => $data['date_of_birth'] ?? null,
                'password'      => Hash::make($data['password']),
                'qr_code'       => $this->qrService->generateUniqueCode(),
            ]);

            // Auto-attach subscription if code has one (client role)
            if ($code->subscription_plan_id && $user->isClient()) {
                $plan = $code->subscriptionPlan;
                Subscription::create([
                    'user_id'           => $user->id,
                    'plan_id'           => $plan->id,
                    'assigned_by'       => $code->created_by,
                    'price_paid'        => $plan->price,
                    'sessions_remaining'=> $plan->sessions_count,
                    'starts_at'         => today(),
                    'expires_at'        => today()->addDays($plan->duration_days),
                    'status'            => 'active',
                ]);
            }

            $code->update([
                'status'       => 'used',
                'activated_by' => $user->id,
                'activated_at' => now(),
            ]);

            return $user;
        });
    }
}
