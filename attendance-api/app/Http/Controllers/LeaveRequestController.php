<?php

namespace App\Http\Controllers;

use App\Models\LeaveBalance;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class LeaveRequestController extends Controller
{
    // Admin — list all requests
    public function index(Request $request)
    {
        $query = LeaveRequest::with(['employee', 'leaveType', 'approvedBy'])
            ->where('company_id', auth()->user()->company_id)
            ->orderBy('created_at', 'desc');

        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        return response()->json(['data' => $query->get()]);
    }

    // Employee — submit a request
    public function store(Request $request)
    {
        $user     = $request->user();
        $employee = $user->employee;

        if (!$employee) {
            return response()->json(['message' => 'No employee record linked.'], 404);
        }

        $data = $request->validate([
            'leave_type_id' => 'required|exists:leave_types,id',
            'start_date'    => 'required|date|after_or_equal:today',
            'end_date'      => 'required|date|after_or_equal:start_date',
            'reason'        => 'required|string|max:1000',
        ]);

        // Calculate days
        $days = Carbon::parse($data['start_date'])
            ->diffInDaysFiltered(
                fn ($date) => !$date->isWeekend(),
                Carbon::parse($data['end_date'])->addDay()
            );

        // Check balance
        $balance = LeaveBalance::where('employee_id', $employee->id)
            ->where('leave_type_id', $data['leave_type_id'])
            ->where('year', now()->year)
            ->first();

        if (!$balance || $balance->remaining_days < $days) {
            return response()->json([
                'message' => 'Insufficient leave balance.',
            ], 422);
        }

        // Check for overlapping requests
        $overlap = LeaveRequest::where('employee_id', $employee->id)
            ->where('status', '!=', 'rejected')
            ->where(function ($q) use ($data) {
                $q->whereBetween('start_date', [$data['start_date'], $data['end_date']])
                  ->orWhereBetween('end_date', [$data['start_date'], $data['end_date']]);
            })->exists();

        if ($overlap) {
            return response()->json([
                'message' => 'You already have a leave request for these dates.',
            ], 422);
        }

        $leaveRequest = LeaveRequest::create([
            'company_id'    => $user->company_id,
            'employee_id'   => $employee->id,
            'leave_type_id' => $data['leave_type_id'],
            'start_date'    => $data['start_date'],
            'end_date'      => $data['end_date'],
            'days'          => $days,
            'reason'        => $data['reason'],
            'status'        => 'pending',
        ]);

        return response()->json(['data' => $leaveRequest->load(['leaveType'])], 201);
    }

    // Admin — approve or reject
    public function action(Request $request, LeaveRequest $leaveRequest)
    {
        $data = $request->validate([
            'action'           => 'required|in:approved,rejected',
            'rejection_reason' => 'required_if:action,rejected|nullable|string',
        ]);

        if ($leaveRequest->status !== 'pending') {
            return response()->json(['message' => 'This request has already been actioned.'], 422);
        }

        $leaveRequest->update([
            'status'           => $data['action'],
            'approved_by'      => auth()->id(),
            'approved_at'      => now(),
            'rejection_reason' => $data['rejection_reason'] ?? null,
        ]);

        // If approved, deduct from balance
        if ($data['action'] === 'approved') {
            LeaveBalance::where('employee_id', $leaveRequest->employee_id)
                ->where('leave_type_id', $leaveRequest->leave_type_id)
                ->where('year', $leaveRequest->start_date->year)
                ->increment('used_days', $leaveRequest->days);
        }

        return response()->json(['data' => $leaveRequest->load(['employee', 'leaveType', 'approvedBy'])]);
    }

    // Employee — their own requests
    public function myRequests(Request $request)
    {
        $employee = $request->user()->employee;

        if (!$employee) {
            return response()->json(['data' => []]);
        }

        $requests = LeaveRequest::with(['leaveType'])
            ->where('employee_id', $employee->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['data' => $requests]);
    }

    // Employee — their balances
    public function myBalances(Request $request)
    {
        $employee = $request->user()->employee;

        if (!$employee) {
            return response()->json(['data' => []]);
        }

        $balances = LeaveBalance::with('leaveType')
            ->where('employee_id', $employee->id)
            ->where('year', now()->year)
            ->get()
            ->map(fn ($b) => [
                'leave_type'     => $b->leaveType->name,
                'color'          => $b->leaveType->color,
                'total_days'     => $b->total_days,
                'used_days'      => $b->used_days,
                'remaining_days' => $b->remaining_days,
            ]);

        return response()->json(['data' => $balances]);
    }
}