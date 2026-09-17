<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Minimal access-control fields for the future administration area.
 *
 * Only one role value is used for now. Granular roles are intentionally not
 * created until SPIN confirms the actual administrative responsibilities.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('administrator')->after('password');
            $table->string('job_title')->nullable()->after('role');
            $table->boolean('is_active')->default(true)->after('job_title');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['role', 'job_title', 'is_active']);
        });
    }
};
