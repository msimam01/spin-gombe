<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Projects and activities.
 *
 * Both concepts share one structure because they carry identical information.
 * `type` distinguishes them (a project may contain many activities), which
 * avoids duplicating an almost identical table.
 *
 * Status values, dates and locations are only populated from official SPIN
 * information — nothing is inferred or invented.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('title');
            $table->string('type')->default('project'); // project|activity
            $table->text('summary')->nullable();
            $table->longText('description')->nullable();

            $table->foreignId('project_component_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('location_id')->nullable()->constrained()->nullOnDelete();

            // Official status wording, supplied by SPIN (e.g. "Ongoing").
            $table->string('status_label')->nullable();
            $table->date('started_on')->nullable();
            $table->date('completed_on')->nullable();
            $table->string('cover_image')->nullable();

            $table->string('status')->default('draft');
            $table->timestamp('published_at')->nullable();
            $table->unsignedInteger('sort')->default(0);
            $table->timestamps();

            $table->index(['type', 'status', 'published_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
