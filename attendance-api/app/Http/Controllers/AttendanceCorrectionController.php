<?php

namespace App\Http\Controllers;

use App\Models\AttendanceCorrection;
use App\Models\AttendanceLog;
use App\Services\AttendanceSummaryService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class AttendanceCorrectionController extends Controller
{
    // Admin — list all corrections
    public function index(Request $request)
    {
        $query = AttendanceCorrection::with(['employee', 'approvedBy'])
            ->where('company_id', auth()->user()->company_id)
            ->orderBy('created_at', 'desc');

        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        return response()->json(['data' => $query->get()]);
    }

    // Employee — submit correction
    public function store(Request $request)
    {
        $user = $request->user();
        $employee = $user->employee;

        if (!$employee) {
            return response()->json(['message' => 'No employee record linked.'], 404);
        }

        $data = $request->validate([
            'date' => 'required|date|after_or_equal:' . now()->subDays(7)->toDateString() . '|before_or_equal:today',
            'requested_check_in' => 'nullable|date_format:H:i',
            'requested_check_out' => 'nullable|date_format:H:i',
            'reason' => 'required|string|max:1000',
        ]);

        if (empty($data['requested_check_in']) && empty($data['requested_check_out'])) {
            return response()->json([
                'message' => 'Please provide at least one of requested check-in or check-out.',
            ], 422);
        }

        // Check for existing pending correction for same date
        $existing = AttendanceCorrection::where('employee_id', $employee->id)
            ->where('date', $data['date'])
            ->where('status', 'pending')
            ->exists();

        if ($existing) {
            return response()->json([
                'message' => 'You already have a pending correction request for this date.',
            ], 422);
        }

        // Get current attendance for that day
        $service = app(AttendanceSummaryService::class);
        $summaries = $service->getSummaries($data['date'], $data['date'], $employee->id);
        $today = $summaries[0] ?? null;

        $correction = AttendanceCorrection::create([
            'company_id' => $user->company_id,
            'employee_id' => $employee->id,
            'date' => $data['date'],
            'current_check_in' => $today?->check_in ?? null,
            'current_check_out' => $today?->check_out ?? null,
            'requested_check_in' => $data['requested_check_in'] ?? null,
            'requested_check_out' => $data['requested_check_out'] ?? null,
            'reason' => $data['reason'],
            'status' => 'pending',
        ]);

        return response()->json(['data' => $correction], 201);
    }

    // Admin — approve or reject
    public function action(Request $request, AttendanceCorrection $correction)
    {
        $data = $request->validate([
            'action' => 'required|in:approved,rejected',
            'rejection_reason' => 'required_if:action,rejected|nullable|string',
        ]);

        if ($correction->status !== 'pending') {
            return response()->json(['message' => 'This request has already been actioned.'], 422);
        }

        if ($data['action'] === 'approved') {
            $this->applyCorrection($correction);
        }

        $correction->update([
            'status' => $data['action'],
            'approved_by' => auth()->id(),
            'approved_at' => now(),
            'rejection_reason' => $data['rejection_reason'] ?? null,
        ]);

        return response()->json([
            'data' => $correction->load(['employee', 'approvedBy'])
        ]);
    }

    // Employee — their own corrections
    public function myCorrections(Request $request)
    {
        $employee = $request->user()->employee;

        if (!$employee) {
            return response()->json(['data' => []]);
        }

        $corrections = AttendanceCorrection::where('employee_id', $employee->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['data' => $corrections]);
    }

    // Apply approved correction to attendance logs
    private function applyCorrection(AttendanceCorrection $correction): void
    {
        $date = $correction->date->toDateString();
        $employeeId = $correction->employee_id;

        $logs = AttendanceLog::where('employee_id', $employeeId)
            ->whereDate('attendance_time', $date)
            ->orderBy('attendance_time')
            ->get();

        if ($correction->requested_check_in) {
            $checkInTime = $date . ' ' . $correction->requested_check_in;

            if ($logs->isNotEmpty()) {
                $logs->first()->update([
                    'attendance_time' => $checkInTime,
                ]);
            } else {
                AttendanceLog::create([
                    'company_id' => $correction->company_id,
                    'employee_id' => $employeeId,
                    'device_id' => $correction->employee->device_id,
                    'device_log_uid' => -($correction->id * 10 + 1), // e.g. -11 for correction 1 check-in
                    'attendance_time' => $checkInTime,
                    'state' => 1,
                    'type' => 0,
                ]);
            }
        }

        if ($correction->requested_check_out) {
            $checkOutTime = $date . ' ' . $correction->requested_check_out;

            if ($logs->count() > 1) {
                $logs->last()->update([
                    'attendance_time' => $checkOutTime,
                ]);
            } else {
                AttendanceLog::create([
                    'company_id' => $correction->company_id,
                    'employee_id' => $employeeId,
                    'device_id' => $correction->employee->device_id,
                    'device_log_uid' => -($correction->id * 10 + 2), // e.g. -12 for correction 1 check-out
                    'attendance_time' => $checkOutTime,
                    'state' => 1,
                    'type' => 1,
                ]);
            }
        }
    }
}