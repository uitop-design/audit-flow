import { FileQuestion } from 'lucide-react';
import { Link } from 'react-router';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <EmptyState
      icon={FileQuestion}
      title="Page not found"
      description="The page you are looking for does not exist or has moved."
      action={
        <Button asChild variant="outline" size="sm">
          <Link to="/">Back to dashboard</Link>
        </Button>
      }
    />
  );
}
