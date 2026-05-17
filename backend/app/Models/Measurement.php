<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Measurement extends Model
{
    protected $fillable = [
        'client_id','recorded_by','weight_kg','height_cm','body_fat_percent',
        'muscle_mass_kg','chest_cm','waist_cm','hips_cm','left_arm_cm',
        'right_arm_cm','left_leg_cm','right_leg_cm','notes','measured_at',
    ];
    protected $casts = ['measured_at'=>'date'];
    public function client(): BelongsTo { return $this->belongsTo(User::class,'client_id'); }
    public function recordedBy(): BelongsTo { return $this->belongsTo(User::class,'recorded_by'); }
}
