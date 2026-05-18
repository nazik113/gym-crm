<?php
namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\{Note, User};
use App\Services\NotificationService;
use Illuminate\Http\{JsonResponse, Request};

class NoteController extends Controller
{
    public function forClient(Request $request, User $client): JsonResponse
    {
        $notes = $client->notes()
            ->with('author:id,first_name,last_name')
            ->when(!$request->user()->isAdmin(), fn($q) => $q->where('is_private', false)
                ->orWhere('author_id', $request->user()->id))
            ->latest()
            ->get();

        return response()->json(['data' => $notes]);
    }

    public function store(Request $request, User $client): JsonResponse
    {
        $data = $request->validate([
            'title'      => 'nullable|string|max:200',
            'content'    => 'required|string',
            'type'       => 'sometimes|in:general,health,progress,warning,medical,training,nutrition',
            'is_private' => 'boolean',
        ]);

        $note = Note::create([
            ...$data,
            'client_id' => $client->id,
            'author_id' => $request->user()->id,
        ]);

        $author = $request->user();
        NotificationService::notifyClient(
            $client->id,
            "{$author->first_name} {$author->last_name} добавил заметку: " . ($data['title'] ?? substr($data['content'], 0, 50)),
            'note'
        );

        return response()->json($note->load('author:id,first_name,last_name'), 201);
    }

    public function destroy(Note $note): JsonResponse
    {
        $note->delete();
        return response()->json(['message' => 'Note deleted']);
    }
}
