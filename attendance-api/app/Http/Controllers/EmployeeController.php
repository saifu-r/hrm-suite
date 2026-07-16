<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\Shift;
use Illuminate\Http\Request;
use Rats\Zkteco\Lib\ZKTeco;

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

        $nameChanged = isset($data['name']) && $data['name'] !== $employee->name;

        // Update in database first
        $employee->update($data);

        // If name changed, push to device
        if ($nameChanged && $employee->device) {
            try {
                $zk = new ZKTeco(
                    $employee->device->ip_address,
                    $employee->device->port
                );
                $zk->connect();
                $zk->setUser(
                    $employee->device_uid,
                    $employee->device_user_id,
                    $data['name'],
                    '',   // password — empty
                    0,    // role — normal user
                    $employee->card_number ?? ''
                );
                $zk->disconnect();
            } catch (\Exception $e) {
                // Device unreachable — DB already updated, just warn
                // Don't fail the request because of device error
                return response()->json([
                    'data'    => $employee->load(['device', 'shift']),
                    'warning' => 'Employee updated in system but could not reach device: ' . $e->getMessage(),
                ]);
            }
        }

        return response()->json(['data' => $employee->load(['device', 'shift'])]);
    }

    public function shifts()
    {
        $shifts = Shift::all(['id', 'name']);
        return response()->json(['data' => $shifts]);
    }
}