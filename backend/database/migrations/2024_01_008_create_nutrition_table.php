<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('nutrition_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('trainer_id')->constrained('users');
            $table->string('title', 200);
            $table->text('description')->nullable();
            $table->integer('daily_calories')->nullable();
            $table->integer('protein_g')->nullable();
            $table->integer('carbs_g')->nullable();
            $table->integer('fats_g')->nullable();
            $table->enum('status', ['active', 'completed', 'draft'])->default('draft');
            $table->timestamps();
        });

        Schema::create('meals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('plan_id')->constrained('nutrition_plans')->cascadeOnDelete();
            $table->string('name', 100); // Breakfast, Lunch, Dinner, Snack
            $table->time('time_of_day')->nullable();
            $table->integer('calories')->nullable();
            $table->integer('protein_g')->nullable();
            $table->integer('carbs_g')->nullable();
            $table->integer('fats_g')->nullable();
            $table->text('foods')->nullable(); // JSON list of foods
            $table->text('notes')->nullable();
            $table->integer('order')->default(0);
            $table->timestamps();
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('meals');
        Schema::dropIfExists('nutrition_plans');
    }
};
