<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class LeaveRequest extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'company_id', 'employee_id', 'leave_type_id',
        'start_date', 'end_date', 'days', 'reason',
        'status', 'approved_by', 'approved_at', 'rejection_reason',
    ];

    protected $casts = [
        'start_date'  => 'date',
        'end_date'    => 'date',
        'approved_at' => 'datetime',
    ];

    public function employee()   { return $this->belongsTo(Employee::class); }
    public function leaveType()  { return $this->belongsTo(LeaveType::class); }
    public function approvedBy() { return $this->belongsTo(User::class, 'approved_by'); }
}