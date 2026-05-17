<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\{BelongsTo,HasMany};

class NutritionPlan extends Model
{
    protected $fillable = ['client_id','trainer_id','title','description','daily_calories','protein_g','carbs_g','fats_g','status'];
    public function client(): BelongsTo { return $this->belongsTo(User::class,'client_id'); }
    public function trainer(): BelongsTo { return $this->belongsTo(User::class,'trainer_id'); }
    public function meals(): HasMany { return $this->hasMany(Meal::class,'plan_id')->orderBy('order'); }
}
