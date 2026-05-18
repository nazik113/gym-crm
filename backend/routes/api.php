<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\{
    AuthController, UserController, ClientController,
    TrainerController, SubscriptionController, SubscriptionPlanController,
    AttendanceController, WorkoutController, NutritionController,
    MeasurementController, NoteController, PresenceController,
    RegistrationCodeController, QRController, AnalyticsController,
    DashboardController
};

// ─── Public Auth ─────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::post('validate-code', [AuthController::class, 'validateCode']);
    Route::post('register', [AuthController::class, 'register']);
});

// ─── Protected Routes ────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    Route::post('auth/logout', [AuthController::class, 'logout']);
    Route::get('auth/me', [AuthController::class, 'me']);
    Route::post('auth/refresh', [AuthController::class, 'refresh']);

    // ── QR (all roles) ──────────────────────────────────────
    Route::get('qr/my', [QRController::class, 'myQR']);
    Route::post('qr/scan', [QRController::class, 'scan'])->middleware('role:admin,trainer');

    // ── Clients (admin full, trainer limited) ───────────────
    Route::apiResource('clients', ClientController::class)->middleware('role:admin,trainer');
    Route::get('clients/{client}/subscription', [ClientController::class, 'subscription']);
    Route::get('clients/{client}/attendance', [ClientController::class, 'attendance']);
    Route::get('clients/{client}/measurements', [MeasurementController::class, 'forClient']);
    Route::post('clients/{client}/measurements', [MeasurementController::class, 'store'])->middleware('role:admin,trainer');
    Route::get('clients/{client}/notes', [NoteController::class, 'forClient']);
    Route::post('clients/{client}/notes', [NoteController::class, 'store'])->middleware('role:admin,trainer');
    Route::delete('notes/{note}', [NoteController::class, 'destroy'])->middleware('role:admin,trainer');

    // ── Admin-only routes ────────────────────────────────────
    Route::middleware('role:admin')->group(function () {

        // Dashboard
        Route::get('dashboard', [DashboardController::class, 'index']);
        Route::get('dashboard/stats', [DashboardController::class, 'stats']);

        // Users
        Route::apiResource('users', UserController::class);
        Route::post('users/{user}/toggle-active', [UserController::class, 'toggleActive']);

        // Trainers
        Route::apiResource('trainers', TrainerController::class);
        Route::post('trainers/{trainer}/assign-client', [TrainerController::class, 'assignClient']);

        // Subscription Plans
        Route::apiResource('subscription-plans', SubscriptionPlanController::class);

        // Subscriptions
        Route::apiResource('subscriptions', SubscriptionController::class);
        Route::post('clients/{client}/subscriptions', [SubscriptionController::class, 'assignToClient']);
        Route::patch('subscriptions/{sub}/extend', [SubscriptionController::class, 'extend']);
        Route::patch('subscriptions/{sub}/deduct-session', [SubscriptionController::class, 'deductSession']);
        Route::patch('subscriptions/{sub}/cancel', [SubscriptionController::class, 'cancel']);

        // Presence
        Route::get('presence', [PresenceController::class, 'index']);
        Route::post('presence/{client}/enter', [PresenceController::class, 'enter']);
        Route::post('presence/{client}/leave', [PresenceController::class, 'leave']);

        // Registration Codes
        Route::apiResource('registration-codes', RegistrationCodeController::class);
        Route::post('registration-codes/{code}/revoke', [RegistrationCodeController::class, 'revoke']);

        // Analytics
        Route::get('analytics/revenue', [AnalyticsController::class, 'revenue']);
        Route::get('analytics/attendance', [AnalyticsController::class, 'attendance']);
        Route::get('analytics/subscriptions', [AnalyticsController::class, 'subscriptions']);
        Route::get('analytics/clients', [AnalyticsController::class, 'clients']);
        Route::get('analytics/trainers', [AnalyticsController::class, 'trainers']);
    });

    // ── Trainer routes ───────────────────────────────────────
    Route::middleware('role:admin,trainer')->group(function () {
        Route::get('my-clients', [TrainerController::class, 'myClients']);
        Route::get('trainer/profile', [TrainerController::class, 'myProfile']);
        Route::patch('trainer/profile', [TrainerController::class, 'updateMyProfile']);
        Route::post('trainer/profile/avatar', [TrainerController::class, 'uploadAvatar']);

        // Workouts
        Route::apiResource('workout-plans', WorkoutController::class);
        Route::post('workout-plans/{plan}/days', [WorkoutController::class, 'addDay']);
        Route::delete('workout-days/{day}', [WorkoutController::class, 'deleteDay']);
        Route::post('workout-days/{day}/exercises', [WorkoutController::class, 'addExercise']);
        Route::put('exercises/{exercise}', [WorkoutController::class, 'updateExercise']);
        Route::delete('exercises/{exercise}', [WorkoutController::class, 'deleteExercise']);

        // Nutrition
        Route::apiResource('nutrition-plans', NutritionController::class);
        Route::post('nutrition-plans/{plan}/meals', [NutritionController::class, 'addMeal']);
        Route::put('meals/{meal}', [NutritionController::class, 'updateMeal']);
        Route::delete('meals/{meal}', [NutritionController::class, 'deleteMeal']);
    });

    // ── Client (self) routes ─────────────────────────────────
    Route::middleware('role:client')->group(function () {
        Route::get('my/profile', [ClientController::class, 'myProfile']);
        Route::patch('my/profile', [ClientController::class, 'updateMyProfile']);
        Route::post('my/profile/avatar', [ClientController::class, 'uploadAvatar']);
        Route::get('my/qr', [QRController::class, 'myQR']);
        Route::get('my/subscription', [ClientController::class, 'mySubscription']);
        Route::get('my/attendance', [ClientController::class, 'myAttendance']);
        Route::get('my/workouts', [WorkoutController::class, 'myWorkouts']);
        Route::get('my/nutrition', [NutritionController::class, 'myNutrition']);
        Route::get('my/measurements', [MeasurementController::class, 'myMeasurements']);
    });

    // ── Attendance (all auth) ────────────────────────────────
    Route::apiResource('attendance', AttendanceController::class)->only(['index', 'show']);
});
