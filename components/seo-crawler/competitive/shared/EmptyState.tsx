import type { ReactNode } from 'react';
import { EMPTY_STATE_BOX, EMPTY_STATE_SUBTEXT, EMPTY_STATE_TEXT } from './styles';

interface EmptyStateProps {
  icon?: ReactNode;
  message: string;
  submessage?: string;
  action?: { label: string; onClick: () => void };
}

export default function EmptyState({ icon, message, submessage, action }: EmptyStateProps) {
  return (
    <div className={EMPTY_STATE_BOX}>
      {icon && <div className="mb-2 flex justify-center text-[#333]">{icon}</div>}
      <p className={EMPTY_STATE_TEXT}>{message}</p>
      {submessage && <p className={EMPTY_STATE_SUBTEXT}>{submessage}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-3 text-[10px] font-bold uppercase tracking-widest text-[#F5364E] hover:underline"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
