<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\Device;
use App\Services\AttendanceSummaryService;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(private AttendanceSummaryService $service) {}

    public function index()
    {
        $today     = now()->toDateString();
        $companyId = auth()->user()->company_id;

        // Total active employees
        $totalEmployees = Employee::where('company_id', $companyId)
            ->where('is_active', true)
            ->count();

        // Today's summaries
        $summaries = collect($this->service->getSummaries($today, $today));

        $presentToday  = $summaries->filter(fn ($r) => !$r['is_absent'])->count();
        $absentToday   = $summaries->filter(fn ($r) => $r['is_absent'])->count();
        $lateToday     = $summaries->filter(fn ($r) => $r['is_late'])->count();

        // Attendance rate
        $attendanceRate = $totalEmployees > 0
            ? round(($presentToday / $totalEmployees) * 100)
            : 0;

        // Devices
        $devices = Device::where('company_id', $companyId)->get();

        return response()->json([
            'stats' => [
                'total_employees'  => $totalEmployees,
                'present_today'    => $presentToday,
                'absent_today'     => $absentToday,
                'late_today'       => $lateToday,
                'attendance_rate'  => $attendanceRate,
            ],
            'today_activity' => array_values($summaries->toArray()),
            'devices'        => $devices,
        ]);
    }
}