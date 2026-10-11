<?php

namespace Tests\Unit;

use App\Support\ProjectSummary;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * Deterministic, local summary generation for projects and activities.
 *
 * The persisted summary always comes from the backend routine; these tests
 * pin the sentence-boundary behaviour, limits, edge cases and the
 * explicit-summary-wins rule.
 */
final class ProjectSummaryTest extends TestCase
{
    public static function descriptionProvider(): array
    {
        return [
            'null description' => [null, null],
            'empty description' => ['', null],
            'whitespace-only' => ["   \n  \t ", null],
            'markup-only' => ['<p>   </p><br>', null],
            'first sentence preserved, second appended' => [
                'Smart agriculture is providing improved technologies to farmers. Further work continues.',
                'Smart agriculture is providing improved technologies to farmers. Further work continues.',
            ],
            'markup flattened' => [
                '<p>All tags are flattened to plain text.</p><ul><li>No markup survives.</li></ul>',
                'All tags are flattened to plain text. No markup survives.',
            ],
        ];
    }

    #[Test]
    #[DataProvider('descriptionProvider')]
    public function a_summary_is_derived_from_the_description(?string $description, ?string $expected): void
    {
        $this->assertSame($expected, ProjectSummary::fromDescription($description));
    }

    #[Test]
    public function whole_sentences_are_kept_up_to_the_limit(): void
    {
        $text = 'First sentence is reasonably short. Second sentence is also quite brief here. Third sentence will not fit with the others because the combined length would exceed the limit exactly a bit. Fourth.';

        $this->assertSame(
            'First sentence is reasonably short. Second sentence is also quite brief here.',
            ProjectSummary::fromDescription($text),
        );
    }

    #[Test]
    public function a_single_overlong_sentence_is_elliptically_truncated_at_the_limit(): void
    {
        $text = str_repeat('abcdefgh ', 40).'end'; // 353 chars, no sentence break.

        $summary = ProjectSummary::fromDescription($text);

        // The cut is right-trimmed first, so the ellipsis appends cleanly.
        $this->assertSame(rtrim(mb_substr($text, 0, ProjectSummary::LIMIT)).'…', $summary);
        $this->assertTrue(str_ends_with($summary, '…'));
    }

    #[Test]
    public function sentences_never_break_mid_sentence(): void
    {
        $long = 'A somewhat long opening sentence that keeps running well past the summary limit because it stretches across far more characters than a concise summary would ever need to carry for its readers.';
        $this->assertGreaterThan(ProjectSummary::LIMIT, mb_strlen($long));

        $this->assertSame(
            rtrim(mb_substr($long, 0, ProjectSummary::LIMIT)).'…',
            ProjectSummary::fromDescription($long.' Short.'),
        );
    }

    #[Test]
    public function an_explicitly_supplied_summary_is_preserved(): void
    {
        $this->assertSame(
            'Official summary copy.',
            ProjectSummary::resolve('Official summary copy.', 'A description. That would otherwise be derived. Since it is long enough. Beyond the limit. Yet more.'),
        );
    }

    #[Test]
    public function a_blank_summary_falls_back_to_the_derived_one(): void
    {
        $this->assertSame(
            'Derived from description.',
            ProjectSummary::resolve('   ', 'Derived from description.'),
        );

        $this->assertNull(
            ProjectSummary::resolve(null, '   '),
        );
    }
}
