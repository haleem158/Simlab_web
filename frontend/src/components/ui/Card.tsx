import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

export function Card({ 
  children, 
  className = '', 
  padding = 'md',
  hover = false 
}: CardProps) {
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8'
  };
  
  const hoverClass = hover ? 'hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10' : '';
  
  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-2xl ${paddingClasses[padding]} ${hoverClass} transition-all ${className}`}>
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function CardHeader({ 
  title, 
  description, 
  action,
  className = '' 
}: CardHeaderProps) {
  return (
    <div className={`flex items-start justify-between mb-6 ${className}`}>
      <div>
        <h3 className="text-xl font-bold text-white mb-1">{title}</h3>
        {description && (
          <p className="text-sm text-slate-400">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  change?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  color?: 'default' | 'blue' | 'green' | 'red' | 'purple' | 'yellow';
}

export function MetricCard({ 
  label, 
  value, 
  subValue,
  change,
  icon,
  color = 'default'
}: MetricCardProps) {
  const colorClasses = {
    default: 'text-white',
    blue: 'text-blue-400',
    green: 'text-green-400',
    red: 'text-red-400',
    purple: 'text-purple-400',
    yellow: 'text-yellow-400'
  };
  
  return (
    <Card padding="md" hover>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-slate-400 mb-1">{label}</p>
          <p className={`text-2xl font-bold ${colorClasses[color]}`}>
            {value}
          </p>
          {subValue && (
            <p className="text-xs text-slate-500 mt-1">{subValue}</p>
          )}
          {change && (
            <p className={`text-xs mt-1 ${change.isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {change.isPositive ? '↑' : '↓'} {Math.abs(change.value)}%
            </p>
          )}
        </div>
        {icon && (
          <div className="ml-3 text-slate-600">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}