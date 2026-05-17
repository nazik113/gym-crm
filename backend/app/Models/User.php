<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\{BelongsTo, HasMany, HasOne};
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'role_id', 'phone', 'first_name', 'last_name',
        'date_of_birth', 'avatar', 'password', 'qr_code',
        'is_active', 'is_in_gym', 'gym_entered_at', 'trainer_id', 'notes',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'date_of_birth' => 'date',
        'gym_entered_at' => 'datetime',
        'is_active' => 'boolean',
        'is_in_gym' => 'boolean',
    ];

    protected $appends = ['full_name'];

    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    public function trainer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'trainer_id');
    }

    public function clients(): HasMany
    {
        return $this->hasMany(User::class, 'trainer_id');
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    public function activeSubscription(): HasOne
    {
        return $this->hasOne(Subscription::class)
            ->where('status', 'active')
            ->where('expires_at', '>=', now()->toDateString())
            ->latest();
    }

    public function attendance(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }

    public function workoutPlans(): HasMany
    {
        return $this->hasMany(WorkoutPlan::class, 'client_id');
    }

    public function nutritionPlans(): HasMany
    {
        return $this->hasMany(NutritionPlan::class, 'client_id');
    }

    public function measurements(): HasMany
    {
        return $this->hasMany(Measurement::class, 'client_id');
    }

    public function notes(): HasMany
    {
        return $this->hasMany(Note::class, 'client_id');
    }

    public function isAdmin(): bool { return $this->role->name === 'admin'; }
    public function isTrainer(): bool { return $this->role->name === 'trainer'; }
    public function isClient(): bool { return $this->role->name === 'client'; }
}
