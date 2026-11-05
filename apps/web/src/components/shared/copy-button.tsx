import { Check, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface CopyButtonProps {
  value: string;
  /** Describes what is copied, e.g. "event ID"; used for the accessible name. */
  label: string;
}

const RESET_AFTER_MS = 1500;

export function CopyButton({ value, label }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return;
    }
    const timer = window.setTimeout(() => setCopied(false), RESET_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      toast.error(`Could not copy ${label}`);
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={copy}
          aria-label={copied ? `Copied ${label}` : `Copy ${label}`}
        >
          {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{copied ? 'Copied' : `Copy ${label}`}</TooltipContent>
    </Tooltip>
  );
}
