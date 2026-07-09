<?php

namespace App\Http\Controllers;

use App\Models\Timetable;
use Illuminate\Http\Request;

class TimetableController extends Controller
{
    public function index()
    {
        return response()->json(['data' => Timetable::orderBy('name')->get()]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'             => 'required|string|max:255',
            'on_duty_time'     => 'required|date_format:H:i',
            'off_duty_time'    => 'required|date_format:H:i',
            'late_time'        => 'required|integer|min:0',
            'leave_early_time' => 'required|integer|min:0',
            'beginning_in'     => 'required|date_format:H:i',
            'ending_in'        => 'required|date_format:H:i',
            'beginning_out'    => 'required|date_format:H:i',
            'ending_out'       => 'required|date_format:H:i',
        ]);

        // Append seconds so PostgreSQL time columns accept it
        foreach (['on_duty_time','off_duty_time','beginning_in','ending_in','beginning_out','ending_out'] as $field) {
            $data[$field] .= ':00';
        }

        $timetable = Timetable::create($data);
        return response()->json(['data' => $timetable], 201);
    }

    public function update(Request $request, Timetable $timetable)
    {
        $data = $request->validate([
            'name'             => 'required|string|max:255',
            'on_duty_time'     => 'required|date_format:H:i',
            'off_duty_time'    => 'required|date_format:H:i',
            'late_time'        => 'required|integer|min:0',
            'leave_early_time' => 'required|integer|min:0',
            'beginning_in'     => 'required|date_format:H:i',
            'ending_in'        => 'required|date_format:H:i',
            'beginning_out'    => 'required|date_format:H:i',
            'ending_out'       => 'required|date_format:H:i',
        ]);

        foreach (['on_duty_time','off_duty_time','beginning_in','ending_in','beginning_out','ending_out'] as $field) {
            $data[$field] .= ':00';
        }

        $timetable->update($data);
        return response()->json(['data' => $timetable]);
    }

    public function destroy(Timetable $timetable)
    {
        $timetable->delete();
        return response()->json(['message' => 'Deleted.']);
    }
}