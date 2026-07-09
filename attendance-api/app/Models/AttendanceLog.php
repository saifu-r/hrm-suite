<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class AttendanceLog extends Model
{
    use SoftDeletes, LogsActivity;
    protected $fillable = [
        'company_id',
        'employee_id',
        'device_id',
        'device_log_uid',
        'attendance_time',
        'state',
        'type'
    ];
    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
    public function device()
    {
        return $this->belongsTo(Device::class);
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name', 'is_active', 'shift_id'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}
