<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('attendance_logs', function (Blueprint $table) {
            $table->id();

            $table->foreignId('employee_id')->constrained();
            $table->foreignId('device_id')->constrained();

            $table->integer('device_log_uid');

            $table->timestamp('attendance_time');

            $table->integer('state')->nullable();
            $table->integer('type')->nullable();

            $table->timestamps();

            $table->unique([
                'employee_id',
                'attendance_time',
                'device_id'
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendance_logs');
    }
};
