import EmptyState from '@/components/feedback/EmptyState';

export default function PhotoNotFound() {
  return (
    <EmptyState
      headingLevel={1}
      title="Photo not found"
      description="This photo doesn’t exist or was removed."
      links={[{ href: '/', label: 'Go home' }]}
    />
  );
}
