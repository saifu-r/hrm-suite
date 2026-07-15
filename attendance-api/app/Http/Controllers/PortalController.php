<?php

namespace App\Http\Controllers;

use App\Services\AttendanceSummaryService;
use Illuminate\Http\Request;

class PortalController extends Controller
{
    public function __construct(private AttendanceSummaryService $service) {}

    public function today(Request $request)
    {
        $user     = $request->user()->load('employee.shift.mondayTimetable',
            'employee.shift.tuesdayTimetable',
            'employee.shift.wednesdayTimetable',
            'employee.shift.thursdayTimetable',
            'employee.shift.fridayTimetable',
            'employee.shift.saturdayTimetable',
            'employee.shift.sundayTimetable'
        );
        $employee = $user->employee;

        if (!$employee) {
            return response()->json(['message' => 'No employee record linked to this account.'], 404);
        }

        $today     = now()->toDateString();
        $summaries = $this->service->getSummaries($today, $today, $employee->id);
        $today_record = $summaries[0] ?? null;

        return response()->json([
            'employee' => [
                'id'          => $employee->id,
                'name'        => $employee->name,
                'card_number' => $employee->card_number,
                'shift'       => $employee->shift?->name,
                'device'      => $employee->device?->name,
            ],
            'today' => $today_record,
        ]);
    }

    public function history(Request $request)
    {
        $user     = $request->user()->load('employee');
        $employee = $user->employee;

        if (!$employee) {
            return response()->json(['message' => 'No employee record linked.'], 404);
        }

        $request->validate([
            'start_date' => 'required|date',
            'end_date'   => 'required|date|after_or_equal:start_date',
        ]);

        $summaries = $this->service->getSummaries(
            $request->input('start_date'),
            $request->input('end_date'),
            $employee->id
        );

        return response()->json(['data' => $summaries]);
    }

    public function profile(Request $request)
    {
        $user     = $request->user()->load('employee.shift', 'employee.device', 'company');
        $employee = $user->employee;

        return response()->json([
            'name'        => $user->name,
            'email'       => $user->email,
            'role'        => $user->role,
            'company'     => $user->company?->name,
            'timezone'    => $user->company?->timezone,
            'employee'    => $employee ? [
                'id'          => $employee->id,
                'card_number' => $employee->card_number,
                'shift'       => $employee->shift?->name,
                'device'      => $employee->device?->name,
                'is_active'   => $employee->is_active,
            ] : null,
        ]);
    }
}