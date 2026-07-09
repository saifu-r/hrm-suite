<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Carbon\Carbon;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;


class Shift extends Model
{
    use SoftDeletes, LogsActivity;
    protected $fillable = [
        'company_id',
        'name',
        'monday_timetable_id',
        'tuesday_timetable_id',
        'wednesday_timetable_id',
        'thursday_timetable_id',
        'friday_timetable_id',
        'saturday_timetable_id',
        'sunday_timetable_id',
    ];

    public function mondayTimetable()    { return $this->belongsTo(Timetable::class, 'monday_timetable_id'); }
    public function tuesdayTimetable()   { return $this->belongsTo(Timetable::class, 'tuesday_timetable_id'); }
    public function wednesdayTimetable() { return $this->belongsTo(Timetable::class, 'wednesday_timetable_id'); }
    public function thursdayTimetable()  { return $this->belongsTo(Timetable::class, 'thursday_timetable_id'); }
    public function fridayTimetable()    { return $this->belongsTo(Timetable::class, 'friday_timetable_id'); }
    public function saturdayTimetable()  { return $this->belongsTo(Timetable::class, 'saturday_timetable_id'); }
    public function sundayTimetable()    { return $this->belongsTo(Timetable::class, 'sunday_timetable_id'); }

    public function employees()
    {
        return $this->hasMany(Employee::class);
    }

    /**
     * Get the timetable for a specific date.
     * Returns null if that day is a day off.
     */
    public function timetableForDate(Carbon $date): ?Timetable
    {
        $method = match ($date->dayOfWeek) {
            Carbon::MONDAY    => 'mondayTimetable',
            Carbon::TUESDAY   => 'tuesdayTimetable',
            Carbon::WEDNESDAY => 'wednesdayTimetable',
            Carbon::THURSDAY  => 'thursdayTimetable',
            Carbon::FRIDAY    => 'fridayTimetable',
            Carbon::SATURDAY  => 'saturdayTimetable',
            Carbon::SUNDAY    => 'sundayTimetable',
        };

        return $this->$method;
    }

        public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name', 'is_active', 'shift_id'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}