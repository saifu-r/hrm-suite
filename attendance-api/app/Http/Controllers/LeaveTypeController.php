<?php

namespace App\Http\Controllers;

use App\Models\LeaveType;
use Illuminate\Http\Request;

class LeaveTypeController extends Controller
{
    public function index()
    {
        return response()->json([
            'data' => LeaveType::where('company_id', auth()->user()->company_id)
                ->orderBy('name')->get()
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'         => 'required|string|max:255',
            'days_allowed' => 'required|integer|min:0',
            'color'        => 'required|string',
        ]);

        $leaveType = LeaveType::create([
            ...$data,
            'company_id' => auth()->user()->company_id,
        ]);

        return response()->json(['data' => $leaveType], 201);
    }

    public function update(Request $request, LeaveType $leaveType)
    {
        $data = $request->validate([
            'name'         => 'sometimes|string|max:255',
            'days_allowed' => 'sometimes|integer|min:0',
            'color'        => 'sometimes|string',
            'is_active'    => 'sometimes|boolean',
        ]);

        $leaveType->update($data);
        return response()->json(['data' => $leaveType]);
    }

    public function destroy(LeaveType $leaveType)
    {
        $leaveType->delete();
        return response()->json(['message' => 'Deleted.']);
    }
}