<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\SoftDeletes;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'company_id',
        'employee_id',  // ← add this
        'name',
        'email',
        'password',
        'role',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    // Role helpers
    public function isSuperAdmin(): bool
    {
        return $this->role === 'super_admin';
    }
    public function isCompanyAdmin(): bool
    {
        return $this->role === 'company_admin';
    }
    public function isHR(): bool
    {
        return $this->role === 'hr';
    }
    public function isManager(): bool
    {
        return $this->role === 'manager';
    }
    public function isEmployee(): bool
    {
        return $this->role === 'employee';
    }

    public function employee()
    {
        return $this->belongsTo(\App\Models\Employee::class);
    }
    public function isAdminLevel(): bool
    {
        return in_array($this->role, ['super_admin', 'company_admin', 'hr', 'manager']);
    }
}