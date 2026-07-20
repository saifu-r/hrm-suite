<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Holiday extends Model
{
    protected $fillable = [
        'company_id',
        'name',
        'date',
        'end_date',
        'type',
    ];

    protected $casts = [
        'date' => 'date',
        'end_date' => 'date',
    ];
}