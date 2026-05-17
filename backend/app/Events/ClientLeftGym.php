<?php
namespace App\Events;
use App\Models\{Attendance, User};
use Illuminate\Broadcasting\{Channel, InteractsWithSockets};
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ClientLeftGym implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public User $client, public Attendance $attendance) {}

    public function broadcastOn(): Channel { return new Channel('gym-presence'); }

    public function broadcastWith(): array
    {
        return [
            'event'      => 'client.left',
            'client_id'  => $this->client->id,
            'left_at'    => $this->attendance->checked_out_at,
            'duration'   => $this->attendance->duration_minutes,
        ];
    }
}
