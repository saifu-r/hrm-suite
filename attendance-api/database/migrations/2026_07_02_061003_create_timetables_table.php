<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('timetables', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->time('on_duty_time');
            $table->time('off_duty_time');
            $table->unsignedInteger('late_time')->default(0);        // grace mins for late arrival
            $table->unsignedInteger('leave_early_time')->default(0); // grace mins for early leave
            $table->time('beginning_in');                            // earliest valid check-in
            $table->time('ending_in');                               // latest valid check-in
            $table->time('beginning_out');                           // earliest valid check-out
            $table->time('ending_out');                              // latest valid check-out
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('timetables');
    }
};
