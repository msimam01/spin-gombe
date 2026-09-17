<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The four official SPIN project components.
 *
 * Components are manageable entities: each can hold objectives, activities
 * and relations to projects, photos, videos and documents.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('project_components', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name');
            $table->string('short_name')->nullable();
            $table->text('summary')->nullable();
            $table->longText('description')->nullable();
            $table->json('objectives')->nullable();
            $table->json('activities')->nullable();
            $table->string('icon')->nullable();
            $table->string('cover_image')->nullable();
            $table->string('status')->default('draft');
            $table->timestamp('published_at')->nullable();
            $table->unsignedInteger('sort')->default(0);
            $table->timestamps();

            $table->index(['status', 'published_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_components');
    }
};
