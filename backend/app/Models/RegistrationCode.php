<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\{BelongsTo};

class RegistrationCode extends Model
{
    protected $fillable = [
        'code','created_by','role_id','hidden_first_name','hidden_last_name',
        'hidden_phone','subscription_plan_id','status','activated_by','activated_at','expires_at',
    ];
    protected $casts = ['activated_at'=>'datetime','expires_at'=>'datetime'];
    protected $hidden = ['hidden_first_name','hidden_last_name','hidden_phone'];

    public function role(): BelongsTo      { return $this->belongsTo(Role::class); }
    public function createdBy(): BelongsTo { return $this->belongsTo(User::class,'created_by'); }
    public function activatedBy(): BelongsTo { return $this->belongsTo(User::class,'activated_by'); }
    public function subscriptionPlan(): BelongsTo { return $this->belongsTo(SubscriptionPlan::class); }
}
