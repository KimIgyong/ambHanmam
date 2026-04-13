import type { SVGProps } from 'react';

interface MyCellIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

const MyCellIcon = ({ size = 18, color = 'currentColor', ...props }: MyCellIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={1.7}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <polygon points="12,2.5 20,7 20,17 12,21.5 4,17 4,7" />
    <circle cx="12" cy="12" r="2.5" />
  </svg>
);

export default MyCellIcon;
