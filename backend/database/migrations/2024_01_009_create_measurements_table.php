<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('measurements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->decimal('weight_kg', 5, 2)->nullable();
            $table->decimal('height_cm', 5, 2)->nullable();
            $table->decimal('body_fat_percent', 4, 2)->nullable();
            $table->decimal('muscle_mass_kg', 5, 2)->nullable();
            $table->decimal('chest_cm', 5, 2)->nullable();
            $table->decimal('waist_cm', 5, 2)->nullable();
            $table->decimal('hips_cm', 5, 2)->nullable();
            $table->decimal('left_arm_cm', 5, 2)->nullable();
            $table->decimal('right_arm_cm', 5, 2)->nullable();
            $table->decimal('left_leg_cm', 5, 2)->nullable();
            $table->decimal('right_leg_cm', 5, 2)->nullable();
            $table->text('notes')->nullable();
            $table->date('measured_at');
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('measurements'); }
};
