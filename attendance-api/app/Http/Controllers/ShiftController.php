<?php

namespace App\Http\Controllers;

use App\Models\Shift;
use Illuminate\Http\Request;

class ShiftController extends Controller
{
    public function index()
    {
        return response()->json([
            'data' => Shift::with([
                'mondayTimetable',
                'tuesdayTimetable',
                'wednesdayTimetable',
                'thursdayTimetable',
                'fridayTimetable',
                'saturdayTimetable',
                'sundayTimetable',
            ])->orderBy('name')->get()
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validateShift($request);
        $shift = Shift::create($data);
        return response()->json(['data' => $shift->load($this->relations())], 201);
    }

    public function update(Request $request, Shift $shift)
    {
        $data = $this->validateShift($request);
        $shift->update($data);
        return response()->json(['data' => $shift->load($this->relations())]);
    }

    public function destroy(Shift $shift)
    {
        $shift->delete();
        return response()->json(['message' => 'Deleted.']);
    }

    private function validateShift(Request $request): array
    {
        return $request->validate([
            'name'                   => 'required|string|max:255',
            'monday_timetable_id'    => 'nullable|exists:timetables,id',
            'tuesday_timetable_id'   => 'nullable|exists:timetables,id',
            'wednesday_timetable_id' => 'nullable|exists:timetables,id',
            'thursday_timetable_id'  => 'nullable|exists:timetables,id',
            'friday_timetable_id'    => 'nullable|exists:timetables,id',
            'saturday_timetable_id'  => 'nullable|exists:timetables,id',
            'sunday_timetable_id'    => 'nullable|exists:timetables,id',
        ]);
    }

    private function relations(): array
    {
        return [
            'mondayTimetable',
            'tuesdayTimetable',
            'wednesdayTimetable',
            'thursdayTimetable',
            'fridayTimetable',
            'saturdayTimetable',
            'sundayTimetable',
        ];
    }
}