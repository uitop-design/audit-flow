import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Radix Select cannot use an empty string as an item value, so "all" needs a sentinel.
const ALL = '__all__';

interface FacetSelectProps {
  label: string;
  value: string | undefined;
  options: readonly string[] | undefined;
  onChange: (value: string | undefined) => void;
  formatOption?: (value: string) => string;
}

/** Single-value filter whose options come from the API's facets, i.e. real data. */
export function FacetSelect({
  label,
  value,
  options,
  onChange,
  formatOption = (option) => option,
}: FacetSelectProps) {
  // Keep a value from the URL selectable even if it is not (or no longer) among the facets.
  const items = value && !options?.includes(value) ? [value, ...(options ?? [])] : (options ?? []);
  return (
    <Select
      value={value ?? ALL}
      onValueChange={(next) => onChange(next === ALL ? undefined : next)}
    >
      <SelectTrigger size="sm" className="w-full sm:w-[170px]" aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>All {label.toLowerCase()}s</SelectItem>
        {items.map((option) => (
          <SelectItem key={option} value={option}>
            {formatOption(option)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
