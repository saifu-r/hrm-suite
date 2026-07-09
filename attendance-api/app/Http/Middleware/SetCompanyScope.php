<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;

class SetCompanyScope extends Middleware
{
    public function handle(Request $request, Closure $next): mixed
    {
        $user = $request->user();

        if ($user && $user->company_id) {
            // Share company_id globally so all queries can use it
            App::instance('company_id', $user->company_id);
        }

        return $next($request);
    }
}