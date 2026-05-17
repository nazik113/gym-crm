<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SubscriptionPlan extends Model
{
    protected $fillable = ['name','description','price','duration_days','sessions_count','is_active','color'];
    protected $casts = ['is_active'=>'boolean','price'=>'float'];
    public function subscriptions(): HasMany { return $this->hasMany(Subscription::class,'plan_id'); }
}
