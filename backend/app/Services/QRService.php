<?php
namespace App\Services;

use App\Models\User;
use Illuminate\Support\Str;

class QRService
{
    public function generateUniqueCode(): string
    {
        do {
            $code = strtoupper(Str::random(12));
        } while (User::where('qr_code', $code)->exists());
        return $code;
    }

    public function resolveUser(string $qrCode): ?User
    {
        return User::where('qr_code', $qrCode)
            ->where('is_active', true)
            ->with(['role', 'trainer', 'activeSubscription'])
            ->first();
    }
}
