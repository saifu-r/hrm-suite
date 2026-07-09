<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

use App\Models\Device;
use App\Models\Employee;
use Rats\Zkteco\Lib\ZKTeco;

class SyncEmployees extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sync:employees';

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

        $zk->connect();

        $users = $zk->getUser();

        foreach ($users as $user) {

            Employee::updateOrCreate(
                [
                    'device_id' => $device->id,
                    'device_user_id' => $user['userid']
                ],
                [
                    'device_uid' => $user['uid'],
                    'name' => $user['name'],
                    'card_number' => $user['cardno']
                ]
            );
        }

        $zk->disconnect();

        $this->info('Employees synced successfully.');
    }
}
