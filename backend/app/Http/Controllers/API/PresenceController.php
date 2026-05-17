<?php
namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\PresenceService;
use Illuminate\Http\{JsonResponse, Request};

class PresenceController extends Controller
{
    public function __construct(private readonly PresenceService $presenceService) {}

    public function index(Request $request): JsonResponse
    {
        $clients = $this->presenceService->currentlyInGym();
        return response()->json(['clients' => $clients, 'count' => $clients->count()]);
    }

    public function enter(Request $request, User $client): JsonResponse
    {
        abort_if(!$client->isClient(), 422, 'Only clients can enter gym.');
        abort_if($client->is_in_gym, 422, 'Client is already in gym.');

        $record = $this->presenceService->enterGym($client, $request->user(), 'manual');
        return response()->json(['message' => 'Client marked as entered', 'attendance' => $record, 'client' => $client->fresh()]);
    }

    public function leave(Request $request, User $client): JsonResponse
    {
        abort_if(!$client->is_in_gym, 422, 'Client is not currently in gym.');

        $record = $this->presenceService->leaveGym($client, $request->user());
        return response()->json(['message' => 'Client marked as left', 'attendance' => $record, 'client' => $client->fresh()]);
    }
}
