<?php

namespace App\Http\Controllers;

use App\Services\AttendanceSummaryService;
use Illuminate\Http\Request;

class AttendanceSummaryController extends Controller
{
    public function __construct(private AttendanceSummaryService $service) {}

    public function index(Request $request)
    {
        $request->validate([
            'start_date'  => 'required|date',
            'end_date'    => 'required|date|after_or_equal:start_date',
            'employee_id' => 'nullable|integer|exists:employees,id',
        ]);

        $summaries = $this->service->getSummaries(
            $request->input('start_date'),
            $request->input('end_date'),
            $request->input('employee_id'),
        );

        return response()->json([
            'data' => $summaries,
            'meta' => [
                'start_date' => $request->input('start_date'),
                'end_date'   => $request->input('end_date'),
                'count'      => count($summaries),
            ],
        ]);
    }
}