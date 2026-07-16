<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
// use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class Employee extends Model
{
    // use SoftDeletes, LogsActivity;
    protected $fillable = [
        'company_id',
        'device_id',
        'device_uid',
        'device_user_id',
        'name',
        'card_number',
        'shift_id', 
        'is_active',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function shift()
    {
        return $this->belongsTo(Shift::class);
    }

    public function device()
    {
        return $this->belongsTo(\App\Models\Device::class);
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name', 'is_active', 'shift_id'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

}