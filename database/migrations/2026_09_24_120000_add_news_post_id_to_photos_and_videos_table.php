<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * News media ownership.
 *
 * Photos and videos already attach to their owner through explicit nullable
 * foreign keys (`project_id`, `project_component_id`, `gallery_id`). A news
 * post could not be an owner at all, so the news detail page borrowed its
 * component's media — component photographs appeared on every article that
 * referenced that component.
 *
 * This adds the same explicit relationship for news. It is deliberately NOT
 * a polymorphic media table and duplicates nothing: the column is nullable
 * and additive, so every existing media record keeps its current owner and
 * no row is touched.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('photos', function (Blueprint $table) {
            $table->foreignId('news_post_id')
                ->nullable()
                ->after('project_component_id')
                ->constrained()
                ->nullOnDelete();
        });

        Schema::table('videos', function (Blueprint $table) {
            $table->foreignId('news_post_id')
                ->nullable()
                ->after('project_component_id')
                ->constrained()
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('photos', function (Blueprint $table) {
            $table->dropConstrainedForeignId('news_post_id');
        });

        Schema::table('videos', function (Blueprint $table) {
            $table->dropConstrainedForeignId('news_post_id');
        });
    }
};
