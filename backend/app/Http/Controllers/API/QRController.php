<?php
namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\{PresenceService, QRService};
use Illuminate\Http\{JsonResponse, Request};

class QRController extends Controller
{
    public function __construct(
        private readonly QRService $qrService,
        private readonly PresenceService $presenceService,
    ) {}

    public function myQR(Request $request): JsonResponse
    {
        return response()->json([
            'qr_code'  => $request->user()->qr_code,
            'user'     => $request->user()->only('id','first_name','last_name','avatar'),
        ]);
    }

    public function scan(Request $request): JsonResponse
    {
        $request->validate(['qr_code' => 'required|string']);

        $client = $this->qrService->resolveUser($request->qr_code);
        if (!$client) {
            return response()->json(['message' => 'QR code not found or user inactive'], 404);
        }

        $scanner = $request->user();
        $isAdmin  = $scanner->isAdmin();

        // Auto check-in on scan
        if ($client->isClient() && !$client->is_in_gym) {
            $attendance = $this->presenceService->enterGym($client, $scanner, 'qr_scan');
        }

        // Return full or limited card based on scanner role
        $client->load([
            'role', 'trainer', 'activeSubscription.plan',
            'subscriptions.plan', 'attendance' => fn($q) => $q->latest()->limit(10),
            'workoutPlans' => fn($q) => $q->where('status','active'),
            'nutritionPlans' => fn($q) => $q->where('status','active'),
            'measurements' => fn($q) => $q->latest()->limit(5),
            'notes' => fn($q) => $q->latest()->limit(5),
        ]);

        return response()->json([
            'client'  => $client,
            'role'    => $scanner->role->name,
            'card'    => $isAdmin ? 'admin_full' : 'trainer_limited',
            'checked_in' => !($client->is_in_gym ?? false),
        ]);
    }
}
