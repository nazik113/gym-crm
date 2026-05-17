<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Meal extends Model
{
    protected $fillable = ['plan_id','name','time_of_day','calories','protein_g','carbs_g','fats_g','foods','notes','order'];
    protected $casts = ['foods'=>'array'];
    public function plan(): BelongsTo { return $this->belongsTo(NutritionPlan::class,'plan_id'); }
}
