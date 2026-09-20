import { AdminSelectField } from '@/components/admin/FormControls';
import type { SelectOption } from '@/types/admin';

/** Which relationship types a media form offers. */
export type RelatedToOption = 'general' | 'project' | 'component' | 'gallery';

interface RelatedToFieldProps {
    idPrefix: string;
    /** The selected relationship type ('' when nothing chosen yet). */
    relatedTo: RelatedToOption | '';
    onRelatedToChange: (value: RelatedToOption) => void;
    /** The selected related record id ('' when none). */
    relatedId: string;
    onRelatedIdChange: (value: string) => void;
    /** Which relationship types this media type supports. */
    supports: RelatedToOption[];
    options: {
        projects: SelectOption[];
        components: SelectOption[];
        galleries: SelectOption[];
    };
    error?: string;
    relatedError?: string;
    disabled?: boolean;
}

const TYPE_LABELS: Record<RelatedToOption, string> = {
    general: 'General / Independent',
    project: 'Project / Activity',
    component: 'Component',
    gallery: 'Gallery',
};

const RELATION_LABELS: Record<Exclude<RelatedToOption, 'general'>, string> = {
    project: 'Project or activity',
    component: 'Component',
    gallery: 'Gallery',
};

/**
 * The human "Related to" selector shared by the media forms.
 *
 * The administrator chooses a relationship type and — unless the record is
 * General/Independent — a concrete record from a dynamic list. No database
 * terminology is exposed; the form simply submits `related_to` +
 * `related_id`, and the server normalises the actual foreign keys.
 */
export function RelatedToField({
    idPrefix,
    relatedTo,
    onRelatedToChange,
    relatedId,
    onRelatedIdChange,
    supports,
    options,
    error,
    relatedError,
    disabled = false,
}: RelatedToFieldProps) {
    const typeOptions = supports.map((value) => ({ value, label: TYPE_LABELS[value] }));
    const relationOptions: SelectOption[] =
        relatedTo === 'project'
            ? options.projects
            : relatedTo === 'component'
              ? options.components
              : relatedTo === 'gallery'
                ? options.galleries
                : [];

    return (
        <div className="grid gap-5 sm:grid-cols-2">
            <AdminSelectField
                id={`${idPrefix}-related-to`}
                name="related_to"
                label="Related to"
                required
                hint="Where this media belongs. General / Independent media appears in the public media section on its own."
                options={[{ value: '', label: 'Choose…' }, ...typeOptions]}
                value={relatedTo}
                onChange={(event) => {
                    onRelatedToChange(event.target.value as RelatedToOption);
                    onRelatedIdChange('');
                }}
                error={error}
                disabled={disabled}
            />

            {relatedTo !== '' && relatedTo !== 'general' && (
                <AdminSelectField
                    id={`${idPrefix}-related-id`}
                    name="related_id"
                    label={RELATION_LABELS[relatedTo]}
                    required
                    hint="Only records that exist in the database are listed."
                    options={[{ value: '', label: `Select ${RELATION_LABELS[relatedTo].toLowerCase()}…` }, ...relationOptions]}
                    value={relatedId}
                    onChange={(event) => onRelatedIdChange(event.target.value)}
                    error={relatedError}
                    disabled={disabled}
                />
            )}
        </div>
    );
}
