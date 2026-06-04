'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

type ButtonVariant = 'primary' | 'ghost' | 'onbrand';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Leading icon name. */
  icon?: IconName;
  /** Trailing icon name. */
  iconRight?: IconName;
  /** Stretch to full width. */
  full?: boolean;
  children?: ReactNode;
}

/** Themed button. Class names mirror the prototype's `.btn` system. */
export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  full,
  children,
  className = '',
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`btn btn-${variant} btn-${size} ${full ? 'btn-full' : ''} ${className}`}
      {...rest}
    >
      {icon && <Icon name={icon} size={size === 'sm' ? 16 : 18} />}
      {children && <span>{children}</span>}
      {iconRight && <Icon name={iconRight} size={size === 'sm' ? 16 : 18} />}
    </button>
  );
}
