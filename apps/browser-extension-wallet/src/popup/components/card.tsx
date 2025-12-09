interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = '', onClick }: CardProps) {
  const clickable = onClick ? 'cursor-pointer hover:bg-midnight-500 transition-colors' : '';

  return (
    <div
      className={`bg-midnight-600 rounded-2xl p-4 ${clickable} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
