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
        Schema::create('shifts', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->foreignId('monday_timetable_id')->nullable()->constrained('timetables')->nullOnDelete();
            $table->foreignId('tuesday_timetable_id')->nullable()->constrained('timetables')->nullOnDelete();
            $table->foreignId('wednesday_timetable_id')->nullable()->constrained('timetables')->nullOnDelete();
            $table->foreignId('thursday_timetable_id')->nullable()->constrained('timetables')->nullOnDelete();
            $table->foreignId('friday_timetable_id')->nullable()->constrained('timetables')->nullOnDelete();
            $table->foreignId('saturday_timetable_id')->nullable()->constrained('timetables')->nullOnDelete();
            $table->foreignId('sunday_timetable_id')->nullable()->constrained('timetables')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shifts');
    }
};
