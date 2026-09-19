<?php

namespace App\Http\Requests\Admin;

use App\Enums\PublicationStatus;
use Illuminate\Validation\Rules\Enum;

/**
 * Validation for updating a project component.
 *
 * Identical field rules to creation, with one deliberate difference: the
 * slug is never accepted from the client. Public component URLs are
 * canonical records of the official programme structure; an administrative
 * rename keeps the existing URL stable, and this form requests class is the
 * single point enforcing it.
 */
class UpdateProjectComponentRequest extends StoreProjectComponentRequest
{
    /**
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        return [
            ...parent::rules(),

            // Rejected, not merely ignored: any attempt to smuggle a slug
            // change through the update endpoint fails validation.
            'slug' => ['prohibited'],
        ];
    }

    /**
     * Friendly message for the rejected slug field.
     */
    public function messages(): array
    {
        return [
            'slug.prohibited' => 'Component web addresses are fixed; the public URL cannot be changed here.',
        ];
    }

}
