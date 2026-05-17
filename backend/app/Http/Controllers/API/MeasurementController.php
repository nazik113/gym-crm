<?php
namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\{Measurement, User};
use Illuminate\Http\{JsonResponse, Request};

class MeasurementController extends Controller
{
    public function forClient(User $client): JsonResponse
    {
        $measurements = $client->measurements()
            ->with('recordedBy:id,first_name,last_name')
            ->latest('measured_at')
            ->get();

        return response()->json(['data' => $measurements]);
    }

    public function store(Request $request, User $client): JsonResponse
    {
        $data = $request->validate([
            'weight_kg'          => 'nullable|numeric',
            'height_cm'          => 'nullable|numeric',
            'body_fat_percent'   => 'nullable|numeric',
            'muscle_mass_kg'     => 'nullable|numeric',
            'chest_cm'           => 'nullable|numeric',
            'waist_cm'           => 'nullable|numeric',
            'hips_cm'            => 'nullable|numeric',
            'left_arm_cm'        => 'nullable|numeric',
            'right_arm_cm'       => 'nullable|numeric',
            'left_leg_cm'        => 'nullable|numeric',
            'right_leg_cm'       => 'nullable|numeric',
            'notes'              => 'nullable|string',
            'measured_at'        => 'nullable|date',
        ]);

        $data['client_id']   = $client->id;
        $data['recorded_by'] = $request->user()->id;
        $data['measured_at'] = $data['measured_at'] ?? today()->toDateString();

        $measurement = Measurement::create($data);
        return response()->json($measurement->load('recordedBy:id,first_name,last_name'), 201);
    }

    public function myMeasurements(Request $request): JsonResponse
    {
        $measurements = $request->user()->measurements()
            ->latest('measured_at')
            ->get();

        return response()->json(['data' => $measurements]);
    }
}
