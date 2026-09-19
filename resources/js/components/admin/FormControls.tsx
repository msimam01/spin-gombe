import { Plus, X } from 'lucide-react';
import type { ChangeEvent, ComponentProps, ReactNode } from 'react';
import { Input, Label, Textarea } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ErrorTextProps {
    id: string;
    message: string;
}

/** Inline server-side validation error, wired for screen readers. */
function ErrorText({ id, message }: ErrorTextProps) {
    return (
        <p id={id} role="alert" className="mt-1.5 text-xs font-medium text-destructive">
            {message}
        </p>
    );
}

interface HintTextProps {
    id: string;
    children: ReactNode;
}

function HintText({ id, children }: HintTextProps) {
    return (
        <p id={id} className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {children}
        </p>
    );
}

function RequiredMark() {
    return (
        <>
            {' '}
            <span aria-hidden="true" className="text-gold-600">
                *
            </span>
            <span className="sr-only">(required)</span>
        </>
    );
}

function describedBy(id: string, hint?: string, error?: string): string | undefined {
    return [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') || undefined;
}

interface AdminTextFieldProps extends Omit<ComponentProps<'input'>, 'id' | 'className'> {
    id: string;
    label: string;
    hint?: string;
    error?: string;
    required?: boolean;
}

/** Single-line text field with label, hint and validation wiring. */
export function AdminTextField({ id, label, hint, error, required, ...props }: AdminTextFieldProps) {
    return (
        <div>
            <Label htmlFor={id}>
                {label}
                {required && <RequiredMark />}
            </Label>
            {hint && <HintText id={`${id}-hint`}>{hint}</HintText>}
            <Input
                id={id}
                aria-invalid={error ? true : undefined}
                aria-describedby={describedBy(id, hint, error)}
                className={cn('mt-1.5', error && 'border-destructive')}
                {...props}
            />
            {error && <ErrorText id={`${id}-error`} message={error} />}
        </div>
    );
}

interface AdminTextareaFieldProps extends Omit<ComponentProps<'textarea'>, 'id' | 'className'> {
    id: string;
    label: string;
    hint?: string;
    error?: string;
    required?: boolean;
    rows?: number;
}

/** Multi-line text field with label, hint and validation wiring. */
export function AdminTextareaField({
    id,
    label,
    hint,
    error,
    required,
    rows = 4,
    ...props
}: AdminTextareaFieldProps) {
    return (
        <div>
            <Label htmlFor={id}>
                {label}
                {required && <RequiredMark />}
            </Label>
            {hint && <HintText id={`${id}-hint`}>{hint}</HintText>}
            <Textarea
                id={id}
                rows={rows}
                aria-invalid={error ? true : undefined}
                aria-describedby={describedBy(id, hint, error)}
                className={cn('mt-1.5', error && 'border-destructive')}
                {...props}
            />
            {error && <ErrorText id={`${id}-error`} message={error} />}
        </div>
    );
}

interface AdminSelectFieldProps extends Omit<ComponentProps<'select'>, 'id' | 'className'> {
    id: string;
    label: string;
    options: { value: string; label: string }[];
    hint?: string;
    error?: string;
    required?: boolean;
}

/** Native select styled to match the admin inputs (keyboard-friendly). */
export function AdminSelectField({
    id,
    label,
    options,
    hint,
    error,
    required,
    ...props
}: AdminSelectFieldProps) {
    return (
        <div>
            <Label htmlFor={id}>
                {label}
                {required && <RequiredMark />}
            </Label>
            {hint && <HintText id={`${id}-hint`}>{hint}</HintText>}
            <select
                id={id}
                aria-invalid={error ? true : undefined}
                aria-describedby={describedBy(id, hint, error)}
                className={cn(
                    'mt-1.5 h-11 w-full rounded-sm border border-input bg-background px-3 text-sm text-foreground',
                    'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-600',
                    'disabled:cursor-not-allowed disabled:opacity-60',
                    error && 'border-destructive',
                )}
                {...props}
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {error && <ErrorText id={`${id}-error`} message={error} />}
        </div>
    );
}

interface ListEditorFieldProps {
    id: string;
    label: string;
    hint?: string;
    error?: string;
    items: string[];
    onChange: (items: string[]) => void;
    placeholder?: string;
    addLabel: string;
}

/**
 * Ordered list editor for the component's objectives / activities — plain
 * string lists matching the model's JSON casts. Blank rows are dropped by
 * the server; rows can be removed individually.
 */
export function ListEditorField({
    id,
    label,
    hint,
    error,
    items,
    onChange,
    placeholder,
    addLabel,
}: ListEditorFieldProps) {
    const update = (index: number, event: ChangeEvent<HTMLInputElement>) =>
        onChange(items.map((item, i) => (i === index ? event.target.value : item)));

    const remove = (index: number) => onChange(items.filter((_, i) => i !== index));

    const add = () => onChange([...items, '']);

    return (
        <fieldset aria-describedby={describedBy(id, hint, error)}>
            <legend className="text-sm font-medium text-foreground">{label}</legend>
            {hint && <HintText id={`${id}-hint`}>{hint}</HintText>}

            {items.length > 0 && (
                <ul className="mt-2 space-y-2">
                    {items.map((item, index) => (
                        <li key={index} className="flex items-center gap-2">
                            <Input
                                value={item}
                                onChange={(event) => update(index, event)}
                                placeholder={placeholder}
                                aria-label={`${label} ${index + 1}`}
                                aria-invalid={error ? true : undefined}
                            />
                            <button
                                type="button"
                                onClick={() => remove(index)}
                                aria-label={`Remove ${label} ${index + 1}`}
                                className="inline-flex size-9 shrink-0 items-center justify-center rounded-sm border border-input bg-background text-muted-foreground transition-colors hover:border-destructive hover:text-destructive focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destructive"
                            >
                                <X aria-hidden="true" className="size-4" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            <button
                type="button"
                onClick={add}
                className="mt-2 inline-flex h-9 items-center gap-1.5 rounded-sm border border-dashed border-input px-3 text-sm font-medium text-muted-foreground transition-colors hover:border-brand-400 hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
                <Plus aria-hidden="true" className="size-4" />
                {addLabel}
            </button>

            {error && <ErrorText id={`${id}-error`} message={error} />}
        </fieldset>
    );
}
