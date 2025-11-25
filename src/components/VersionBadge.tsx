import { APP_VERSION } from '../lib/version';
import { ChangelogDialog } from './ChangelogDialog';

interface VersionBadgeProps {
  variant?: 'default' | 'clickable';
  className?: string;
}

export function VersionBadge({ variant = 'default', className = '' }: VersionBadgeProps) {
  if (variant === 'clickable') {
    return (
      <ChangelogDialog 
        className={className}
      >
        <span style={{ 
          fontSize: '0.75rem', 
          color: '#9ca3af',
          display: 'inline-block'
        }}>
          {APP_VERSION}
        </span>
      </ChangelogDialog>
    );
  }

  return (
    <div className={className}>
      {APP_VERSION}
    </div>
  );
}
