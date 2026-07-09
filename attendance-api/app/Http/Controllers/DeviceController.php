<?php

namespace App\Http\Controllers;

use App\Models\Device;
use Illuminate\Http\Request;
use Rats\Zkteco\Lib\ZKTeco;

class DeviceController extends Controller
{
    public function index()
    {
        $devices = Device::withCount(['employees', 'attendanceLogs'])->get();
        return response()->json(['data' => $devices]);
    }

    public function sync(Device $device)
    {
        try {
            $zk = new ZKTeco($device->ip_address, $device->port);
            $zk->connect();
            $zk->disconnect();
            $online = true;
        } catch (\Exception $e) {
            $online = false;
        }

        if (!$online) {
            return response()->json(['message' => 'Could not connect to device.'], 422);
        }

        // Trigger existing sync commands
        \Artisan::call('sync:employees');
        \Artisan::call('sync:attendance');

        $device->update(['last_sync_at' => now()]);

        return response()->json(['message' => 'Sync complete.', 'last_sync_at' => $device->last_sync_at]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'ip_address' => 'required|ip',
            'port' => 'required|integer|min:1|max:65535',
            'serial_number' => 'nullable|string|max:255',
        ]);

        $device = Device::create($data);

        return response()->json(['data' => $device], 201);
    }
}