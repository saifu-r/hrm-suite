<?php

use App\Http\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AttendanceSummaryController;
use App\Http\Controllers\DeviceController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\TimetableController;
use App\Http\Controllers\ShiftController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\PortalController;
use App\Http\Controllers\LeaveTypeController;
use App\Http\Controllers\LeaveRequestController;

// Public
Route::prefix('v1')->group(function () {
    Route::get('/ping', fn() => response()->json(['status' => 'ok']));
    Route::post('/login', [AuthController::class, 'login']);
});

// Protected
Route::prefix('v1')->middleware(['auth:sanctum'])->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);



    // Employee portal
    Route::middleware('role:employee')->prefix('portal')->group(function () {
        Route::get('/today', [PortalController::class, 'today']);
        Route::get('/history', [PortalController::class, 'history']);
        Route::get('/profile', [PortalController::class, 'profile']);

        Route::get('/leave-balances', [LeaveRequestController::class, 'myBalances']);
        Route::get('/leave-requests', [LeaveRequestController::class, 'myRequests']);
        Route::post('/leave-requests', [LeaveRequestController::class, 'store']);
    });

    // All admin roles
    Route::middleware('role:super_admin,company_admin,hr,manager')->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'index']);
        Route::get('/attendance/summary', [AttendanceSummaryController::class, 'index']);
        Route::get('/employees', [EmployeeController::class, 'index']);
        Route::get('/shifts', [ShiftController::class, 'index']);
        Route::get('/timetables', [TimetableController::class, 'index']);

        // Leave types
        Route::get('/leave-types', [LeaveTypeController::class, 'index']);
        Route::post('/leave-types', [LeaveTypeController::class, 'store']);
        Route::put('/leave-types/{leaveType}', [LeaveTypeController::class, 'update']);
        Route::delete('/leave-types/{leaveType}', [LeaveTypeController::class, 'destroy']);

        // Leave requests — admin
        Route::get('/leave-requests', [LeaveRequestController::class, 'index']);
        Route::post('/leave-requests/{leaveRequest}/action', [LeaveRequestController::class, 'action']);
    });

    // super_admin, company_admin, hr only
    Route::middleware('role:super_admin,company_admin,hr')->group(function () {
        Route::put('/employees/{employee}', [EmployeeController::class, 'update']);
        Route::post('/shifts', [ShiftController::class, 'store']);
        Route::put('/shifts/{shift}', [ShiftController::class, 'update']);
        Route::delete('/shifts/{shift}', [ShiftController::class, 'destroy']);
        Route::post('/timetables', [TimetableController::class, 'store']);
        Route::put('/timetables/{timetable}', [TimetableController::class, 'update']);
        Route::delete('/timetables/{timetable}', [TimetableController::class, 'destroy']);
    });

    // super_admin, company_admin only
    Route::middleware('role:super_admin,company_admin')->group(function () {
        Route::get('/devices', [DeviceController::class, 'index']);
        Route::post('/devices', [DeviceController::class, 'store']);
        Route::post('/devices/{device}/sync', [DeviceController::class, 'sync']);
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::put('/users/{user}', [UserController::class, 'update']);
        Route::get('/users/available-employees', [UserController::class, 'employees']);
    });

});