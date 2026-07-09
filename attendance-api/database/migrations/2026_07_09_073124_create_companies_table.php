<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
public function up()
{
    $tables = ['devices', 'employees', 'attendance_logs', 'shifts', 'timetables'];

    foreach ($tables as $table) {
        Schema::table($table, function (Blueprint $table) {
            $table->foreignId('company_id')
                  ->nullable()
                  ->after('id')
                  ->constrained('companies')
                  ->nullOnDelete();
        });
    }
}

public function down()
{
    $tables = ['devices', 'employees', 'attendance_logs', 'shifts', 'timetables'];

    foreach ($tables as $table) {
        Schema::table($table, function (Blueprint $blueprint) use ($table) {
            $blueprint->dropForeign([$table . '.company_id']);
            $blueprint->dropColumn('company_id');
        });
    }
}
};
