<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AttendanceSummaryController;
use App\Http\Controllers\DeviceController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\TimetableController;
use App\Http\Controllers\ShiftController;

// ─────────────────────────────────────────
// PUBLIC — no token required
// ─────────────────────────────────────────
Route::prefix('v1')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
});

// ─────────────────────────────────────────
// PROTECTED — token required for all below
// ─────────────────────────────────────────
Route::prefix('v1')->middleware(['auth:sanctum'])->group(function () {

    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Devices
    Route::get('/devices', [DeviceController::class, 'index']);
    Route::post('/devices', [DeviceController::class, 'store']);
    Route::post('/devices/{device}/sync', [DeviceController::class, 'sync']);

    // Employees
    Route::get('/employees', [EmployeeController::class, 'index']);
    Route::put('/employees/{employee}', [EmployeeController::class, 'update']);

    // Shifts
    Route::get('/shifts', [ShiftController::class, 'index']);  // ← fixed, was duplicated
    Route::post('/shifts', [ShiftController::class, 'store']);
    Route::put('/shifts/{shift}', [ShiftController::class, 'update']);
    Route::delete('/shifts/{shift}', [ShiftController::class, 'destroy']);

    // Timetables
    Route::get('/timetables', [TimetableController::class, 'index']);
    Route::post('/timetables', [TimetableController::class, 'store']);
    Route::put('/timetables/{timetable}', [TimetableController::class, 'update']);
    Route::delete('/timetables/{timetable}', [TimetableController::class, 'destroy']);

    // Attendance
    Route::get('/attendance/summary', [AttendanceSummaryController::class, 'index']);
});