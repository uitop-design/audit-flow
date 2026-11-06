import { ArrowRight } from 'lucide-react';
import { JsonViewer } from '@/components/shared/json-viewer';
import { diffSnapshots, type FieldChange, type JsonObject, previewJson } from '../../lib/changes';

interface ChangesSectionProps {
  before: JsonObject | null;
  after: JsonObject | null;
}

/**
 * Before/after snapshots side by side when the panel is wide enough, stacked otherwise, with a
 * summary of the top-level fields that changed.
 */
export function ChangesSection({ before, after }: ChangesSectionProps) {
  if (!before && !after) {
    return (
      <p className="text-muted-foreground text-sm">This event did not record a state change.</p>
    );
  }

  const changes = diffSnapshots(before, after);
  const changedKeys = new Set(changes.map((change) => change.key));

  return (
    <div className="space-y-3">
      {before && after ? <ChangeSummary changes={changes} /> : null}
      <div className="grid gap-3 @xl:grid-cols-2">
        <Snapshot
          title="Before"
          value={before}
          emptyText="No previous state: the resource was created by this event."
          highlightKeys={changedKeys}
        />
        <Snapshot
          title="After"
          value={after}
          emptyText="Removed: the resource no longer exists after this event."
          highlightKeys={changedKeys}
        />
      </div>
    </div>
  );
}

function ChangeSummary({ changes }: { changes: FieldChange[] }) {
  if (changes.length === 0) {
    return <p className="text-muted-foreground text-sm">No top-level fields changed.</p>;
  }
  return (
    <ul
      aria-label="Changed fields"
      className="space-y-1 rounded-md border bg-warning/5 p-3 text-xs"
    >
      {changes.map((change) => (
        <li key={change.key} className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 font-mono">
          <span className="font-medium">{change.key}</span>
          {change.kind === 'added' ? (
            <span className="text-muted-foreground">added {previewJson(change.after)}</span>
          ) : change.kind === 'removed' ? (
            <span className="text-muted-foreground">
              removed (was {previewJson(change.before)})
            </span>
          ) : (
            <>
              <span className="text-muted-foreground line-through">
                {previewJson(change.before)}
              </span>
              <ArrowRight className="size-3 text-muted-foreground" aria-label="changed to" />
              <span>{previewJson(change.after)}</span>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}

function Snapshot({
  title,
  value,
  emptyText,
  highlightKeys,
}: {
  title: string;
  value: JsonObject | null;
  emptyText: string;
  highlightKeys: ReadonlySet<string>;
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <h4 className="font-medium text-xs">{title}</h4>
      {value ? (
        <JsonViewer
          value={value}
          label={`${title.toLowerCase()} state`}
          highlightKeys={highlightKeys}
        />
      ) : (
        <p className="rounded-md border border-dashed p-3 text-muted-foreground text-xs">
          {emptyText}
        </p>
      )}
    </div>
  );
}
