import { cn } from '@/lib/utils';
import { CopyButton } from './copy-button';

interface JsonViewerProps {
  value: unknown;
  /** Names the block for copy actions and assistive technology, e.g. "metadata". */
  label: string;
  /** Top-level keys to highlight, e.g. the fields a change touched. */
  highlightKeys?: ReadonlySet<string>;
  className?: string;
}

/** Nested objects deeper than this start collapsed. */
const AUTO_EXPAND_DEPTH = 2;

/**
 * Read-only JSON tree. Nested objects and arrays use native <details>, so they collapse with the
 * keyboard and without JavaScript state. Values are rendered as text only, never as HTML.
 */
export function JsonViewer({ value, label, highlightKeys, className }: JsonViewerProps) {
  return (
    <div className={cn('relative rounded-md border bg-muted/30', className)}>
      <div className="absolute top-1.5 right-1.5">
        <CopyButton value={JSON.stringify(value, null, 2)} label={`${label} JSON`} />
      </div>
      {/* No inner scroll area: the surrounding panel scrolls, and deep levels start collapsed. */}
      <section aria-label={`${label} JSON`} className="p-3 pr-10 font-mono text-xs leading-relaxed">
        <JsonNode value={value} depth={0} isLast highlightKeys={highlightKeys} />
      </section>
    </div>
  );
}

interface JsonNodeProps {
  name?: string;
  value: unknown;
  depth: number;
  isLast: boolean;
  highlightKeys?: ReadonlySet<string>;
}

function JsonNode({ name, value, depth, isLast, highlightKeys }: JsonNodeProps) {
  const highlighted = depth === 1 && name !== undefined && highlightKeys?.has(name);
  const rowClass = cn(
    'whitespace-pre-wrap break-all',
    highlighted && '-mx-1.5 rounded-sm bg-warning/15 px-1.5',
  );
  const comma = isLast ? null : <span className="text-muted-foreground">,</span>;
  const key =
    name === undefined ? null : (
      <>
        <span className="text-foreground">{JSON.stringify(name)}</span>
        <span className="text-muted-foreground">: </span>
      </>
    );

  if (value === null || typeof value !== 'object') {
    return (
      <div className={rowClass} data-highlighted={highlighted || undefined}>
        {key}
        <Primitive value={value} />
        {comma}
      </div>
    );
  }

  const isArray = Array.isArray(value);
  const entries: [string | undefined, unknown][] = isArray
    ? value.map((item) => [undefined, item])
    : Object.entries(value);
  const [open, close] = isArray ? ['[', ']'] : ['{', '}'];

  if (entries.length === 0) {
    return (
      <div className={rowClass} data-highlighted={highlighted || undefined}>
        {key}
        <span className="text-muted-foreground">
          {open}
          {close}
        </span>
        {comma}
      </div>
    );
  }

  const children = entries.map(([childName, childValue], index) => (
    <JsonNode
      // Array items have no names; within one array, positions are stable identities.
      key={childName ?? `item-${index}`}
      name={childName}
      value={childValue}
      depth={depth + 1}
      isLast={index === entries.length - 1}
      highlightKeys={highlightKeys}
    />
  ));

  if (depth === 0) {
    return (
      <div>
        <span className="text-muted-foreground">{open}</span>
        <div className="pl-4">{children}</div>
        <span className="text-muted-foreground">{close}</span>
      </div>
    );
  }

  const count = `${entries.length} ${isArray ? (entries.length === 1 ? 'item' : 'items') : entries.length === 1 ? 'key' : 'keys'}`;
  return (
    <details open={depth < AUTO_EXPAND_DEPTH} data-highlighted={highlighted || undefined}>
      <summary
        className={cn(
          rowClass,
          'cursor-pointer list-none marker:hidden [&::-webkit-details-marker]:hidden',
        )}
      >
        {key}
        <span className="text-muted-foreground">{open}</span>
        {/* Shown only while this node is collapsed. The selector targets this node's own <details>;
            a `group-open` variant would also match any open ancestor. */}
        <span className="text-muted-foreground [details[open]>summary>&]:hidden">
          … {close}
          {comma} <span className="font-sans italic">{count}</span>
        </span>
      </summary>
      <div className="pl-4">{children}</div>
      <div className="whitespace-pre">
        <span className="text-muted-foreground">{close}</span>
        {comma}
      </div>
    </details>
  );
}

function Primitive({ value }: { value: unknown }) {
  if (typeof value === 'string') {
    return <span className="text-emerald-700">{JSON.stringify(value)}</span>;
  }
  if (typeof value === 'number') {
    return <span className="text-sky-700">{String(value)}</span>;
  }
  if (typeof value === 'boolean') {
    return <span className="text-violet-700">{String(value)}</span>;
  }
  return <span className="text-muted-foreground">null</span>;
}
