<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\{BelongsTo};

class Attendance extends Model
{
    protected $table = 'attendance';

    protected $fillable = [
        'user_id','subscription_id','checked_in_by','check_in_method',
        'checked_in_at','checked_out_at','duration_minutes',
    ];
    protected $casts = ['checked_in_at'=>'datetime','checked_out_at'=>'datetime'];
    protected $appends = ['client'];

    public function user(): BelongsTo { return $this->belongsTo(User::class); }
    public function subscription(): BelongsTo { return $this->belongsTo(Subscription::class); }
    public function checkedInBy(): BelongsTo { return $this->belongsTo(User::class,'checked_in_by'); }

    public function getClientAttribute(): ?User
    {
        return $this->user;
    }
}
