<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Company extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'address',
        'timezone',
        'is_active',
    ];

    public function devices()    { return $this->hasMany(Device::class); }
    public function employees()  { return $this->hasMany(Employee::class); }
    public function shifts()     { return $this->hasMany(Shift::class); }
    public function timetables() { return $this->hasMany(Timetable::class); }
}