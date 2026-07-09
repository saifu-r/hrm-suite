<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

use App\Models\Device;
use App\Models\Employee;
use App\Models\AttendanceLog;
use Rats\Zkteco\Lib\ZKTeco;



class SyncAttendance extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sync:attendance';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Command description';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $device = Device::first();

        $zk = new ZKTeco(
            $device->ip_address,
            $device->port
        );

        if (!$zk->connect()) {
            $this->error('Unable to connect to device.');
            return;
        }

        $logs = $zk->getAttendance();

        foreach ($logs as $log) {

            // Find employee by K40 userid
            $employee = Employee::where(
                'device_user_id',
                $log['id']
            )->first();

            // Skip if employee not found
            if (!$employee) {
                continue;
            }

            AttendanceLog::firstOrCreate(
                [
                    'employee_id' => $employee->id,
                    'device_id' => $device->id,
                    'attendance_time' => $log['timestamp']
                ],
                [
                    'device_log_uid' => $log['uid'],
                    'state' => $log['state'],
                    'type' => $log['type']
                ]
            );
        }

        $zk->disconnect();

        $this->info('Attendance synced successfully.');
    }
}
