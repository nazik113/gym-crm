<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('subscription_plans', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->text('description')->nullable();
            $table->decimal('price', 10, 2);
            $table->integer('duration_days');
            $table->integer('sessions_count')->nullable(); // null = unlimited
            $table->boolean('is_active')->default(true);
            $table->string('color', 7)->default('#6366F1'); // UI accent
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('subscription_plans'); }
};
