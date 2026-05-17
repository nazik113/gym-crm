<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\{BelongsTo,HasMany};

class WorkoutPlan extends Model
{
    protected $fillable = ['client_id','trainer_id','title','description','status','start_date','end_date'];
    protected $casts = ['start_date'=>'date','end_date'=>'date'];
    public function client(): BelongsTo { return $this->belongsTo(User::class,'client_id'); }
    public function trainer(): BelongsTo { return $this->belongsTo(User::class,'trainer_id'); }
    public function days(): HasMany { return $this->hasMany(WorkoutDay::class,'plan_id')->orderBy('day_number'); }
}
