<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\Shift;
use Illuminate\Http\Request;

class EmployeeController extends Controller
{
    public function index()
    {
        $employees = Employee::with(['device', 'shift'])->orderBy('name')->get();
        return response()->json(['data' => $employees]);
    }

    public function update(Request $request, Employee $employee)
    {
        $data = $request->validate([
            'name'      => 'sometimes|string|max:255',
            'shift_id'  => 'nullable|exists:shifts,id',
            'is_active' => 'sometimes|boolean',
        ]);

        $employee->update($data);
        return response()->json(['data' => $employee->load(['device', 'shift'])]);
    }

    public function shifts()
    {
        $shifts = Shift::all(['id', 'name']);
        return response()->json(['data' => $shifts]);
    }
}