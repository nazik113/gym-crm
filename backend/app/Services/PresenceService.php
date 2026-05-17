<?php
namespace App\Services;

use App\Events\ClientEnteredGym;
use App\Events\ClientLeftGym;
use App\Models\{Attendance, Subscription, User};
use Illuminate\Support\Facades\DB;

class PresenceService
{
    public function enterGym(User $client, User $checkedInBy, string $method = 'manual'): Attendance
    {
        return DB::transaction(function () use ($client, $checkedInBy, $method) {
            $client->update(['is_in_gym' => true, 'gym_entered_at' => now()]);

            $subscription = $client->activeSubscription;
            $record = Attendance::create([
                'user_id'          => $client->id,
                'subscription_id'  => $subscription?->id,
                'checked_in_by'    => $checkedInBy->id,
                'check_in_method'  => $method,
                'checked_in_at'    => now(),
            ]);

            // Deduct session if sessions-based plan
            if ($subscription && $subscription->sessions_remaining !== null) {
                $subscription->decrement('sessions_remaining');
            }

            event(new ClientEnteredGym($client, $record));
            return $record;
        });
    }

    public function leaveGym(User $client, User $markedBy): Attendance
    {
        return DB::transaction(function () use ($client, $markedBy) {
            $record = Attendance::where('user_id', $client->id)
                ->whereNull('checked_out_at')
                ->latest('checked_in_at')
                ->firstOrFail();

            $duration = (int) now()->diffInMinutes($record->checked_in_at);
            $record->update([
                'checked_out_at'   => now(),
                'duration_minutes' => $duration,
            ]);

            $client->update(['is_in_gym' => false, 'gym_entered_at' => null]);

            event(new ClientLeftGym($client, $record));
            return $record;
        });
    }

    public function currentlyInGym(): \Illuminate\Database\Eloquent\Collection
    {
        return User::where('is_in_gym', true)
            ->whereHas('role', fn($q) => $q->where('name', 'client'))
            ->with(['trainer', 'activeSubscription', 'attendance' => fn($q) => $q->whereNull('checked_out_at')->latest()])
            ->get();
    }
}
