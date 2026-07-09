<?php

namespace App\Services;

use App\Models\AttendanceLog;
use App\Models\Employee;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class AttendanceSummaryService
{
    public function getSummaries(string $startDate, string $endDate, ?int $employeeId = null): array
    {
        // Load all punches in range, grouped by employee + date
        $logsQuery = AttendanceLog::query()
            ->select(['employee_id', 'attendance_time'])
            ->whereBetween('attendance_time', [
                $startDate . ' 00:00:00',
                $endDate   . ' 23:59:59',
            ])
            ->orderBy('attendance_time');

        if ($employeeId) {
            $logsQuery->where('employee_id', $employeeId);
        }

        // Group: [ 'YYYY-MM-DD_employeeId' => [Carbon, Carbon, ...] ]
        $logsByKey = [];
        foreach ($logsQuery->get() as $log) {
            $date = Carbon::parse($log->attendance_time)->toDateString();
            $key  = $date . '_' . $log->employee_id;
            $logsByKey[$key][] = Carbon::parse($log->attendance_time);
        }

        // Load all active employees with shift + timetable relationships
        $employeeQuery = Employee::with([
            'shift.mondayTimetable',
            'shift.tuesdayTimetable',
            'shift.wednesdayTimetable',
            'shift.thursdayTimetable',
            'shift.fridayTimetable',
            'shift.saturdayTimetable',
            'shift.sundayTimetable',
        ])->where('is_active', true);

        if ($employeeId) {
            $employeeQuery->where('id', $employeeId);
        }

        $employees = $employeeQuery->orderBy('name')->get()->keyBy('id');

        // Build date range
        $dates   = [];
        $current = Carbon::parse($startDate);
        $end     = Carbon::parse($endDate);
        while ($current->lte($end)) {
            $dates[] = $current->toDateString();
            $current->addDay();
        }

        $results = [];

        foreach ($dates as $date) {
            $workDate = Carbon::parse($date);

            foreach ($employees as $employee) {
                // Get timetable for this day
                $timetable = null;
                $isDayOff  = false;

                if ($employee->shift) {
                    $timetable = $employee->shift->timetableForDate($workDate);
                    if ($timetable === null) {
                        $isDayOff = true;
                    }
                }

                // Skip day-off days
                if ($isDayOff) continue;

                $key    = $date . '_' . $employee->id;
                $punches = $logsByKey[$key] ?? [];

                // No punches at all → absent
                if (empty($punches)) {
                    $results[] = $this->absentRow($employee, $date, $timetable);
                    continue;
                }

                // Sort punches ascending (already ordered from query but group may scramble)
                usort($punches, fn ($a, $b) => $a->timestamp <=> $b->timestamp);

                $firstPunch = $punches[0];
                $lastPunch  = $punches[count($punches) - 1];

                // Validate check-in: first punch must be within beginning_in → ending_in
                $checkIn   = null;
                $checkOut  = null;

                if ($timetable) {
                    $beginIn  = Carbon::parse($date . ' ' . $timetable->beginning_in);
                    $endIn    = Carbon::parse($date . ' ' . $timetable->ending_in);
                    $beginOut = Carbon::parse($date . ' ' . $timetable->beginning_out);
                    $endOut   = Carbon::parse($date . ' ' . $timetable->ending_out);

                    // First punch within check-in window
                    if ($firstPunch->between($beginIn, $endIn)) {
                        $checkIn = $firstPunch;
                    }

                    // Last punch within check-out window
                    // Only count as checkout if it's a different punch than check-in
                    if (
                        $lastPunch->between($beginOut, $endOut) &&
                        $lastPunch->ne($firstPunch)
                    ) {
                        $checkOut = $lastPunch;
                    }
                } else {
                    // No timetable assigned — fall back to first/last punch
                    $checkIn  = $firstPunch;
                    $checkOut = count($punches) > 1 ? $lastPunch : null;
                }

                // Incomplete if missing either check-in or check-out
                $isIncomplete = $checkIn === null || $checkOut === null;

                // Working hours
                $workingHours        = null;
                $workingMinutesTotal = null;

                if ($checkIn && $checkOut) {
                    $diff                = $checkIn->diffInMinutes($checkOut);
                    $workingMinutesTotal = $diff;
                    $workingHours        = sprintf('%dh %02dm', intdiv($diff, 60), $diff % 60);
                }

                // Late arrival
                $isLate      = false;
                $lateMinutes = null;

                if ($timetable && $checkIn) {
                    $dutyStart    = Carbon::parse($date . ' ' . $timetable->on_duty_time);
                    $lateDeadline = $dutyStart->copy()->addMinutes($timetable->late_time);

                    if ($checkIn->gt($lateDeadline)) {
                        $isLate      = true;
                        $lateMinutes = $checkIn->diffInMinutes($dutyStart);
                    }
                }

                // Early leave
                $isEarlyLeave      = false;
                $earlyLeaveMinutes = null;

                if ($timetable && $checkOut) {
                    $dutyEnd            = Carbon::parse($date . ' ' . $timetable->off_duty_time);
                    $earlyLeaveDeadline = $dutyEnd->copy()->subMinutes($timetable->leave_early_time);

                    if ($checkOut->lt($earlyLeaveDeadline)) {
                        $isEarlyLeave      = true;
                        $earlyLeaveMinutes = $checkOut->diffInMinutes($dutyEnd);
                    }
                }

                $results[] = [
                    'employee_id'           => $employee->id,
                    'employee_name'         => $employee->name,
                    'date'                  => $date,
                    'check_in'              => $checkIn?->format('H:i'),
                    'check_out'             => $checkOut?->format('H:i'),
                    'working_hours'         => $workingHours,
                    'working_minutes_total' => $workingMinutesTotal,
                    'punch_count'           => count($punches),
                    'incomplete'            => $isIncomplete,
                    'is_day_off'            => false,
                    'is_late'               => $isLate,
                    'late_minutes'          => $lateMinutes,
                    'is_early_leave'        => $isEarlyLeave,
                    'early_leave_minutes'   => $earlyLeaveMinutes,
                    'is_absent'             => false,
                    'shift'                 => $employee->shift?->name,
                    'timetable'             => $timetable?->name,
                ];
            }
        }

        return $results;
    }

    private function absentRow($employee, string $date, $timetable): array
    {
        return [
            'employee_id'           => $employee->id,
            'employee_name'         => $employee->name,
            'date'                  => $date,
            'check_in'              => null,
            'check_out'             => null,
            'working_hours'         => null,
            'working_minutes_total' => null,
            'punch_count'           => 0,
            'incomplete'            => false,
            'is_day_off'            => false,
            'is_late'               => false,
            'late_minutes'          => null,
            'is_early_leave'        => false,
            'early_leave_minutes'   => null,
            'is_absent'             => true,
            'shift'                 => $employee->shift?->name,
            'timetable'             => $timetable?->name,
        ];
    }
}