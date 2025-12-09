interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

export function ActionButton({ icon, label, onClick }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex flex-col items-center gap-1 py-3 bg-midnight-600 hover:bg-midnight-500 rounded-xl transition-colors"
    >
      <div className="w-10 h-10 rounded-full bg-accent-purple/20 flex items-center justify-center text-accent-purple">
        {icon}
      </div>
      <span className="text-xs text-text-secondary">{label}</span>
    </button>
  );
}
