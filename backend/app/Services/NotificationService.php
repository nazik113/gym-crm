<?php
namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    /**
     * Send a realtime notification to a specific client via the realtime server.
     */
    public static function notifyClient(int $clientId, string $message, string $type = 'info', array $extra = []): void
    {
        try {
            $url = rtrim(env('REALTIME_INTERNAL_URL', 'http://localhost:3001'), '/') . '/internal/notify';
            Http::withHeaders(['X-Internal-Token' => env('REALTIME_INTERNAL_SECRET', 'gymcrm-internal')])
                ->timeout(2)
                ->post($url, array_merge([
                    'userId'  => $clientId,
                    'message' => $message,
                    'type'    => $type,
                ], $extra));
        } catch (\Exception $e) {
            Log::warning('NotificationService: failed to notify client ' . $clientId . ' — ' . $e->getMessage());
        }
    }
}
