<?php
namespace App\Events;
use App\Models\{Attendance, User};
use Illuminate\Broadcasting\{Channel, InteractsWithSockets};
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ClientEnteredGym implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public User $client, public Attendance $attendance) {}

    public function broadcastOn(): Channel
    {
        return new Channel('gym-presence');
    }

    public function broadcastWith(): array
    {
        return [
            'event'      => 'client.entered',
            'client'     => [
                'id'         => $this->client->id,
                'full_name'  => $this->client->full_name,
                'avatar'     => $this->client->avatar,
                'trainer'    => $this->client->trainer?->full_name,
                'entered_at' => $this->attendance->checked_in_at,
            ],
        ];
    }
}
