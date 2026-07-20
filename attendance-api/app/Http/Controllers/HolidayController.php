<?php

namespace App\Http\Controllers;

use App\Models\Holiday;
use Illuminate\Http\Request;

class HolidayController extends Controller
{
    public function index(Request $request)
    {
        $year = $request->input('year', now()->year);

        $holidays = Holiday::where('company_id', auth()->user()->company_id)
            ->whereYear('date', $year)
            ->orderBy('date')
            ->get();

        return response()->json(['data' => $holidays]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:date',
            'type' => 'required|in:public,company',
        ]);

        $holiday = Holiday::create([
            ...$data,
            'company_id' => auth()->user()->company_id,
        ]);

        return response()->json(['data' => $holiday], 201);
    }

    public function update(Request $request, Holiday $holiday)
    {
        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'date' => 'sometimes|date',
            'type' => 'sometimes|in:public,company',
        ]);

        $holiday->update($data);
        return response()->json(['data' => $holiday]);
    }

    public function destroy(Holiday $holiday)
    {
        $holiday->delete();
        return response()->json(['message' => 'Deleted.']);
    }
}