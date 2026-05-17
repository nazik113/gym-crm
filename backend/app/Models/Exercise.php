<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Exercise extends Model
{
    protected $fillable = [
        'workout_day_id','name','category','sets','reps','weight_kg',
        'rest_seconds','duration_minutes','instructions','video_url','order',
    ];
    protected $casts = ['weight_kg'=>'float'];
    public function day(): BelongsTo { return $this->belongsTo(WorkoutDay::class,'workout_day_id'); }
}
