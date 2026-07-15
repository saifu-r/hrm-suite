<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class UserController extends Controller
{
    public function index()
    {
        $users = User::where('company_id', auth()->user()->company_id)
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'role', 'is_active', 'created_at']);

        return response()->json(['data' => $users]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => ['required', Password::min(8)],
            'role' => 'required|in:super_admin,company_admin,hr,manager,employee',
            'employee_id' => 'nullable|exists:employees,id',
        ]);

        $user = User::create([
            'company_id' => auth()->user()->company_id,
            'employee_id' => $data['employee_id'] ?? null,
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'role' => $data['role'],
            'is_active' => true,
        ]);

        return response()->json(['data' => $user], 201);
    }

    public function update(Request $request, User $user)
    {
        if ($user->company_id !== auth()->user()->company_id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'password' => ['sometimes', 'nullable', Password::min(8)],
            'role' => 'sometimes|in:super_admin,company_admin,hr,manager,employee',
            'is_active' => 'sometimes|boolean',
            'employee_id' => 'nullable|exists:employees,id',
        ]);

        if (isset($data['password']) && $data['password']) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $user->update($data);
        return response()->json(['data' => $user]);
    }

    public function employees()
    {
        $employees = \App\Models\Employee::where('company_id', auth()->user()->company_id)
            ->where('is_active', true)
            ->whereNotIn('id', \App\Models\User::whereNotNull('employee_id')->pluck('employee_id'))
            ->orderBy('name')
            ->get(['id', 'name', 'device_user_id']);

        return response()->json(['data' => $employees]);
    }
}