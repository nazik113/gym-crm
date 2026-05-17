<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('registration_codes', function (Blueprint $table) {
            $table->id();
            $table->string('code', 32)->unique();
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('role_id')->constrained('roles');
            $table->string('hidden_first_name', 100)->nullable();
            $table->string('hidden_last_name', 100)->nullable();
            $table->string('hidden_phone', 20)->nullable();
            $table->foreignId('subscription_plan_id')->nullable()->constrained('subscription_plans')->nullOnDelete();
            $table->enum('status', ['active', 'used', 'expired', 'revoked'])->default('active');
            $table->foreignId('activated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('activated_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('registration_codes'); }
};
