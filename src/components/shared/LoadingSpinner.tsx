interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-6 w-6 border-2',
    md: 'h-10 w-10 border-4',
    lg: 'h-16 w-16 border-[6px]',
  };

  return (
    <div className="flex justify-center items-center" aria-label="Loading">
      <div
        className={`animate-spin rounded-full border-primary border-t-transparent ${sizeClasses[size]} ${className}`}
        role="status"
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
}
