<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\{BelongsTo};

class Subscription extends Model
{
    protected $fillable = [
        'user_id','plan_id','assigned_by','price_paid',
        'sessions_remaining','starts_at','expires_at','status','notes',
    ];
    protected $casts = ['starts_at'=>'date','expires_at'=>'date'];
    public function user(): BelongsTo { return $this->belongsTo(User::class); }
    public function plan(): BelongsTo { return $this->belongsTo(SubscriptionPlan::class,'plan_id'); }
    public function assignedBy(): BelongsTo { return $this->belongsTo(User::class,'assigned_by'); }
    public function isActive(): bool { return $this->status === 'active' && $this->expires_at->isFuture(); }
}
