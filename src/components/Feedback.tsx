export function ErrorBanner({ message }: { message: string }) {
  return <div className="feedback-banner error">{message}</div>;
}

export function SuccessBanner({ message }: { message: string }) {
  return <div className="feedback-banner success">{message}</div>;
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
