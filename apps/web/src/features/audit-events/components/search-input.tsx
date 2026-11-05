import { Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';

export const SEARCH_DEBOUNCE_MS = 300;

interface SearchInputProps {
  value: string | undefined;
  onSearch: (value: string | undefined) => void;
}

/**
 * Debounced search box. The URL holds the applied term; the input keeps a local draft so typing
 * stays responsive, and adopts the URL value when it changes elsewhere (Clear filters, back button).
 */
export function SearchInput({ value, onSearch }: SearchInputProps) {
  const [draft, setDraft] = useState(value ?? '');
  const applied = useRef(value ?? '');

  useEffect(() => {
    if ((value ?? '') !== applied.current) {
      applied.current = value ?? '';
      setDraft(value ?? '');
    }
  }, [value]);

  useEffect(() => {
    const next = draft.trim();
    if (next === applied.current) {
      return;
    }
    const timer = window.setTimeout(() => {
      applied.current = next;
      onSearch(next || undefined);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [draft, onSearch]);

  return (
    <div className="relative w-full sm:max-w-xs">
      <Search
        className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-2.5 size-4 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        type="search"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="Search description, actor, resource…"
        aria-label="Search events"
        className="pr-8 pl-8 [&::-webkit-search-cancel-button]:hidden"
        maxLength={200}
      />
      {draft ? (
        <button
          type="button"
          onClick={() => setDraft('')}
          className="-translate-y-1/2 absolute top-1/2 right-2 rounded p-0.5 text-muted-foreground hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
