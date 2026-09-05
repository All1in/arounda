import EmptyState from '@/components/feedback/EmptyState';

export default function NotFound() {
  return (
    <EmptyState
      headingLevel={1}
      title="Page not found"
      description="The page you were looking for doesn’t exist."
      links={[{ href: '/', label: 'Go home' }]}
    />
  );
}
