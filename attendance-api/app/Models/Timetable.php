<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Timetable extends Model
{
    use SoftDeletes;
    protected $fillable = [
        'company_id',
        'name',
        'on_duty_time',
        'off_duty_time',
        'late_time',
        'leave_early_time',
        'beginning_in',
        'ending_in',
        'beginning_out',
        'ending_out',
    ];

    public function shifts(): \Illuminate\Database\Eloquent\Collection
    {
        // A timetable can be used across many shift-day slots
        return Shift::where('monday_timetable_id', $this->id)
            ->orWhere('tuesday_timetable_id', $this->id)
            ->orWhere('wednesday_timetable_id', $this->id)
            ->orWhere('thursday_timetable_id', $this->id)
            ->orWhere('friday_timetable_id', $this->id)
            ->orWhere('saturday_timetable_id', $this->id)
            ->orWhere('sunday_timetable_id', $this->id)
            ->get();
    }
}