<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Device extends Model
{
    use SoftDeletes;
    protected $fillable = [
        'company_id',
        'name',
        'ip_address',
        'port',
        'serial_number',
        'last_sync_at'
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }
    public function employees()
    {
        return $this->hasMany(\App\Models\Employee::class);
    }

    public function attendanceLogs()
    {
        return $this->hasMany(\App\Models\AttendanceLog::class);
    }
}