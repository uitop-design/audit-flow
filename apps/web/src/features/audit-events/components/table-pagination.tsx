import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatNumber } from '@/lib/format';
import { PAGE_SIZES } from '../lib/filters';

interface TablePaginationProps {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (limit: number) => void;
}

export function TablePagination({
  page,
  limit,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
}: TablePaginationProps) {
  const first = total === 0 ? 0 : (page - 1) * limit + 1;
  const last = Math.min(page * limit, total);
  const canGoBack = page > 1;
  const canGoForward = page < totalPages;

  return (
    <div className="flex flex-col-reverse gap-3 px-1 text-muted-foreground text-sm sm:flex-row sm:items-center sm:justify-between">
      <p aria-live="polite" className="tabular-nums">
        Showing {formatNumber(first)}–{formatNumber(last)} of {formatNumber(total)} events
      </p>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span id="page-size-label" className="whitespace-nowrap">
            Rows per page
          </span>
          <Select value={String(limit)} onValueChange={(value) => onPageSizeChange(Number(value))}>
            <SelectTrigger size="sm" className="w-[72px]" aria-labelledby="page-size-label">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {PAGE_SIZES.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span className="whitespace-nowrap tabular-nums">
          Page {formatNumber(page)} of {formatNumber(Math.max(totalPages, 1))}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            disabled={!canGoBack}
            onClick={() => onPageChange(1)}
            aria-label="First page"
          >
            <ChevronsLeft aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            disabled={!canGoBack}
            onClick={() => onPageChange(page - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            disabled={!canGoForward}
            onClick={() => onPageChange(page + 1)}
            aria-label="Next page"
          >
            <ChevronRight aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            disabled={!canGoForward}
            onClick={() => onPageChange(totalPages)}
            aria-label="Last page"
          >
            <ChevronsRight aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
