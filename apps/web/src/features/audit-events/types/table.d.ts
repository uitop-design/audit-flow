import '@tanstack/react-table';

declare module '@tanstack/react-table' {
  // Column-level presentation hints used by the audit events table. The type parameters must match
  // the library's declaration for the interfaces to merge.
  interface ColumnMeta<TData, TValue> {
    /** Classes applied to both the header and body cells of the column. */
    className?: string;
  }
}
