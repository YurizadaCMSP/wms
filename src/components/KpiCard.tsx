import React, { useState, useEffect, useRef } from 'react';
import type { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: number;
  subtitle?: string;
  icon: LucideIcon;
  color: 'amber' | 'emerald' | 'red' | 'blue' | 'orange';
  onClick?: () => void;
}

const colorMap = {
  amber: { bg: 'bg-amber-50', icon: 'text-amber-500', iconBg: 'bg-amber-100', border: 'border-amber-200' },
  emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-500', iconBg: 'bg-emerald-100', border: 'border-emerald-200' },
  red: { bg: 'bg-red-50', icon: 'text-red-500', iconBg: 'bg-red-100', border: 'border-red-200' },
  blue: { bg: 'bg-blue-50', icon: 'text-blue-500', iconBg: 'bg-blue-100', border: 'border-blue-200' },
  orange: { bg: 'bg-orange-50', icon: 'text-orange-500', iconBg: 'bg-orange-100', border: 'border-orange-200' },
};

const KpiCard: React.FC<KpiCardProps> = ({ title, value, subtitle, icon: Icon, color, onClick }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const animatedRef = useRef(false);
  const colors = colorMap[color];

  useEffect(() => {
    if (animatedRef.current) {
      setDisplayValue(value);
      return;
    }
    animatedRef.current = true;
    const duration = 800;
    const startTime = Date.now();
    const startValue = 0;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(startValue + (value - startValue) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [value]);

  return (
    <div
      onClick={onClick}
      className={`${colors.bg} border ${colors.border} rounded-xl p-5 transition-all duration-200 hover:shadow-md ${
        onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{displayValue.toLocaleString()}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-10 h-10 ${colors.iconBg} rounded-lg flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${colors.icon}`} />
        </div>
      </div>
    </div>
  );
};

export default KpiCard;
