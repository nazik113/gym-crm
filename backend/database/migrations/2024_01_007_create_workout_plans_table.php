<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('workout_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('trainer_id')->constrained('users');
            $table->string('title', 200);
            $table->text('description')->nullable();
            $table->enum('status', ['active', 'completed', 'draft'])->default('draft');
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->timestamps();
        });

        Schema::create('workout_days', function (Blueprint $table) {
            $table->id();
            $table->foreignId('plan_id')->constrained('workout_plans')->cascadeOnDelete();
            $table->string('name', 100); // e.g. "Day 1 - Push"
            $table->integer('day_number');
            $table->string('muscle_groups')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('exercises', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workout_day_id')->constrained('workout_days')->cascadeOnDelete();
            $table->string('name', 200);
            $table->string('category', 100)->nullable(); // strength, cardio, flexibility
            $table->integer('sets')->nullable();
            $table->string('reps', 50)->nullable(); // e.g. "8-12" or "15"
            $table->decimal('weight_kg', 6, 2)->nullable();
            $table->integer('rest_seconds')->nullable();
            $table->integer('duration_minutes')->nullable(); // for cardio
            $table->text('instructions')->nullable();
            $table->string('video_url')->nullable();
            $table->integer('order')->default(0);
            $table->timestamps();
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('exercises');
        Schema::dropIfExists('workout_days');
        Schema::dropIfExists('workout_plans');
    }
};
