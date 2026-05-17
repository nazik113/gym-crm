<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('plan_id')->constrained('subscription_plans');
            $table->foreignId('assigned_by')->nullable()->constrained('users')->nullOnDelete();
            $table->decimal('price_paid', 10, 2);
            $table->integer('sessions_remaining')->nullable();
            $table->date('starts_at');
            $table->date('expires_at');
            $table->enum('status', ['active', 'expired', 'cancelled', 'pending'])->default('pending');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('subscriptions'); }
};
