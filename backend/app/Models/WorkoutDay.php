<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\{BelongsTo,HasMany};

class WorkoutDay extends Model
{
    protected $fillable = ['plan_id','name','day_number','muscle_groups','notes'];
    public function plan(): BelongsTo { return $this->belongsTo(WorkoutPlan::class,'plan_id'); }
    public function exercises(): HasMany { return $this->hasMany(Exercise::class,'workout_day_id')->orderBy('order'); }
}
