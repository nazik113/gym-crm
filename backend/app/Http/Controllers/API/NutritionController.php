<?php
namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\{Meal, NutritionPlan};
use Illuminate\Http\{JsonResponse, Request};

class NutritionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $plans = NutritionPlan::with(['client:id,first_name,last_name', 'trainer:id,first_name,last_name'])
            // Trainers only see their own plans; admins see all
            ->when($user->isTrainer(), fn($q) => $q->where('trainer_id', $user->id))
            ->when($request->client_id, fn($q) => $q->where('client_id', $request->client_id))
            ->when($request->trainer_id && $user->isAdmin(), fn($q) => $q->where('trainer_id', $request->trainer_id))
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->latest()
            ->paginate($request->per_page ?? 20);

        return response()->json($plans);
    }

    public function show(NutritionPlan $nutritionPlan): JsonResponse
    {
        $nutritionPlan->load(['client:id,first_name,last_name', 'trainer:id,first_name,last_name', 'meals']);
        return response()->json($nutritionPlan);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'client_id'      => 'required|exists:users,id',
            'title'          => 'required|string|max:200',
            'description'    => 'nullable|string',
            'daily_calories' => 'nullable|integer|min:0',
            'protein_g'      => 'nullable|numeric',
            'carbs_g'        => 'nullable|numeric',
            'fats_g'         => 'nullable|numeric',
            'status'         => 'sometimes|in:draft,active,completed',
        ]);

        $data['trainer_id'] = $request->user()->id;
        $plan = NutritionPlan::create($data);
        return response()->json($plan->load(['client:id,first_name,last_name', 'trainer:id,first_name,last_name']), 201);
    }

    public function update(Request $request, NutritionPlan $nutritionPlan): JsonResponse
    {
        $data = $request->validate([
            'title'          => 'sometimes|string|max:200',
            'description'    => 'nullable|string',
            'daily_calories' => 'nullable|integer',
            'protein_g'      => 'nullable|numeric',
            'carbs_g'        => 'nullable|numeric',
            'fats_g'         => 'nullable|numeric',
            'status'         => 'sometimes|in:draft,active,completed',
        ]);

        $nutritionPlan->update($data);
        return response()->json($nutritionPlan->load(['client:id,first_name,last_name', 'trainer:id,first_name,last_name', 'meals']));
    }

    public function destroy(NutritionPlan $nutritionPlan): JsonResponse
    {
        $nutritionPlan->delete();
        return response()->json(['message' => 'Nutrition plan deleted']);
    }

    public function myNutrition(Request $request): JsonResponse
    {
        $plans = $request->user()->nutritionPlans()
            ->with(['trainer:id,first_name,last_name', 'meals'])
            ->where('status', 'active')
            ->latest()
            ->get();

        return response()->json(['data' => $plans]);
    }

    public function addMeal(Request $request, NutritionPlan $plan): JsonResponse
    {
        $data = $request->validate([
            'name'        => 'required|string|max:200',
            'time_of_day' => 'nullable|string|max:50',
            'calories'    => 'nullable|integer',
            'protein_g'   => 'nullable|numeric',
            'carbs_g'     => 'nullable|numeric',
            'fats_g'      => 'nullable|numeric',
            'foods'       => 'nullable|array',
            'notes'       => 'nullable|string',
            'order'       => 'nullable|integer',
        ]);

        $meal = $plan->meals()->create($data);
        return response()->json($meal, 201);
    }

    public function updateMeal(Request $request, Meal $meal): JsonResponse
    {
        $data = $request->validate([
            'name'        => 'sometimes|string|max:200',
            'time_of_day' => 'nullable|string|max:50',
            'calories'    => 'nullable|integer',
            'protein_g'   => 'nullable|numeric',
            'carbs_g'     => 'nullable|numeric',
            'fats_g'      => 'nullable|numeric',
            'foods'       => 'nullable|array',
            'notes'       => 'nullable|string',
            'order'       => 'nullable|integer',
        ]);

        $meal->update($data);
        return response()->json($meal);
    }

    public function deleteMeal(Meal $meal): JsonResponse
    {
        $meal->delete();
        return response()->json(['message' => 'Meal deleted']);
    }
}
