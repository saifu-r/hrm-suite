<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Device;
use App\Models\Employee;
use Rats\Zkteco\Lib\ZKTeco;

class SyncEmployees extends Command
{
    protected $signature   = 'sync:employees';
    protected $description = 'Sync employees from ZKTeco device';

    public function handle()
    {
        $devices = Device::all();

        foreach ($devices as $device) {
            $this->info("Syncing device: {$device->name}");

            try {
                $zk = new ZKTeco($device->ip_address, $device->port);
                $zk->connect();
                $users = $zk->getUser();
            } catch (\Exception $e) {
                $this->error("Could not connect to {$device->name}: " . $e->getMessage());
                continue;
            }

            $deviceUserIds = collect($users)->pluck('userid')->map(fn ($id) => (string) $id);

            foreach ($users as $user) {
                $deviceName = trim($user['name']);
                $employee   = Employee::where('device_id', $device->id)
                    ->where('device_user_id', (string) $user['userid'])
                    ->first();

                if ($employee) {
                    // Push software name back to device
                    try {
                        $zk->setUser(
                            $employee->device_uid,
                            $employee->device_user_id,
                            $employee->name,
                            '',
                            0,
                            trim($employee->card_number ?? '')
                        );
                    } catch (\Exception $e) {
                        $this->warn("Could not push name to device for {$employee->name}: " . $e->getMessage());
                    }

                    // Update everything except name
                    $employee->update([
                        'device_uid'  => $user['uid'],
                        'card_number' => $user['cardno'] ?? null,
                        'company_id'  => $device->company_id,
                        'is_active'   => true,
                    ]);

                } else {
                    // New employee from device — pull name
                    $name = empty($deviceName) || is_numeric($deviceName)
                        ? "Employee " . $user['userid']
                        : $deviceName;

                    Employee::create([
                        'device_id'      => $device->id,
                        'device_user_id' => (string) $user['userid'],
                        'device_uid'     => $user['uid'],
                        'name'           => $name,
                        'card_number'    => $user['cardno'] ?? null,
                        'company_id'     => $device->company_id,
                        'is_active'      => true,
                    ]);

                    $this->info("Added: {$name}");
                }
            }

            // Mark removed employees as inactive
            $removed = Employee::where('device_id', $device->id)
                ->whereNotIn('device_user_id', $deviceUserIds)
                ->get();

            foreach ($removed as $employee) {
                $employee->update(['is_active' => false]);
                $this->warn("Deactivated: {$employee->name}");
            }

            try {
                $zk->disconnect();
            } catch (\Exception $e) {
                // silently fail
            }

            $this->info("Done. Synced " . count($users) . " employees.");
        }
    }
}