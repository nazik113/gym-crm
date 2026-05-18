<?php
namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\{Exercise, WorkoutDay, WorkoutPlan};
use App\Services\NotificationService;
use Illuminate\Http\{JsonResponse, Request};

class WorkoutController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $plans = WorkoutPlan::with(['client:id,first_name,last_name', 'trainer:id,first_name,last_name'])
            // Trainers only see their own plans; admins see all
            ->when($user->isTrainer(), fn($q) => $q->where('trainer_id', $user->id))
            ->when($request->client_id, fn($q) => $q->where('client_id', $request->client_id))
            ->when($request->trainer_id && $user->isAdmin(), fn($q) => $q->where('trainer_id', $request->trainer_id))
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->latest()
            ->paginate($request->per_page ?? 20);

        return response()->json($plans);
    }

    public function show(WorkoutPlan $workoutPlan): JsonResponse
    {
        $workoutPlan->load(['client:id,first_name,last_name', 'trainer:id,first_name,last_name', 'days.exercises']);
        return response()->json($workoutPlan);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'client_id'   => 'required|exists:users,id',
            'title'       => 'required|string|max:200',
            'description' => 'nullable|string',
            'status'      => 'sometimes|in:draft,active,completed',
            'start_date'  => 'nullable|date',
            'end_date'    => 'nullable|date|after_or_equal:start_date',
        ]);

        $data['trainer_id'] = $request->user()->id;
        $plan = WorkoutPlan::create($data);

        $trainer = $request->user();
        NotificationService::notifyClient(
            $data['client_id'],
            "{$trainer->first_name} {$trainer->last_name} создал план тренировок: {$data['title']}",
            'workout'
        );

        return response()->json($plan->load(['client:id,first_name,last_name', 'trainer:id,first_name,last_name']), 201);
    }

    public function update(Request $request, WorkoutPlan $workoutPlan): JsonResponse
    {
        $data = $request->validate([
            'title'       => 'sometimes|string|max:200',
            'description' => 'nullable|string',
            'status'      => 'sometimes|in:draft,active,completed',
            'start_date'  => 'nullable|date',
            'end_date'    => 'nullable|date',
        ]);

        $workoutPlan->update($data);
        return response()->json($workoutPlan->load(['client:id,first_name,last_name', 'trainer:id,first_name,last_name', 'days.exercises']));
    }

    public function destroy(WorkoutPlan $workoutPlan): JsonResponse
    {
        $workoutPlan->delete();
        return response()->json(['message' => 'Workout plan deleted']);
    }

    public function myWorkouts(Request $request): JsonResponse
    {
        $plans = $request->user()->workoutPlans()
            ->with(['trainer:id,first_name,last_name', 'days.exercises'])
            ->where('status', 'active')
            ->latest()
            ->get();

        return response()->json(['data' => $plans]);
    }

    public function addDay(Request $request, WorkoutPlan $plan): JsonResponse
    {
        $data = $request->validate([
            'name'          => 'required|string|max:100',
            'day_number'    => 'required|integer|min:1',
            'muscle_groups' => 'nullable|string',
            'notes'         => 'nullable|string',
        ]);

        $day = $plan->days()->create($data);
        return response()->json($day->load('exercises'), 201);
    }

    public function addExercise(Request $request, WorkoutDay $day): JsonResponse
    {
        $data = $request->validate([
            'name'              => 'required|string|max:200',
            'category'          => 'nullable|string|max:100',
            'sets'              => 'nullable|integer|min:1',
            'reps'              => 'nullable|string|max:50',
            'weight_kg'         => 'nullable|numeric',
            'rest_seconds'      => 'nullable|integer',
            'duration_minutes'  => 'nullable|integer',
            'instructions'      => 'nullable|string',
            'video_url'         => 'nullable|url',
            'order'             => 'nullable|integer',
        ]);

        $exercise = $day->exercises()->create($data);
        return response()->json($exercise, 201);
    }

    public function updateExercise(Request $request, Exercise $exercise): JsonResponse
    {
        $data = $request->validate([
            'name'              => 'sometimes|string|max:200',
            'category'          => 'nullable|string|max:100',
            'sets'              => 'nullable|integer',
            'reps'              => 'nullable|string|max:50',
            'weight_kg'         => 'nullable|numeric',
            'rest_seconds'      => 'nullable|integer',
            'duration_minutes'  => 'nullable|integer',
            'instructions'      => 'nullable|string',
            'video_url'         => 'nullable|url',
            'order'             => 'nullable|integer',
        ]);

        $exercise->update($data);
        return response()->json($exercise);
    }

    public function deleteExercise(Exercise $exercise): JsonResponse
    {
        $exercise->delete();
        return response()->json(['message' => 'Exercise deleted']);
    }

    public function deleteDay(WorkoutDay $day): JsonResponse
    {
        $day->exercises()->delete();
        $day->delete();
        return response()->json(['message' => 'Day deleted']);
    }
}
