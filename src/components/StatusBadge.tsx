import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

const statusMap: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Ativo' },
  returned: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Devolvido' },
  partial: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Parcial' },
  pending: { bg: 'bg-red-100', text: 'text-red-700', label: 'Pendente' },
  acknowledged: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Ciente' },
  manual: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Manual' },
  automatic: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Automatica' },
  in_stock: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Em Estoque' },
  low_stock: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Baixo Estoque' },
  out_of_stock: { bg: 'bg-red-100', text: 'text-red-700', label: 'Sem Estoque' },
  admin: { bg: 'bg-red-100', text: 'text-red-700', label: 'Admin' },
  coordinator: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Coordenador' },
  member: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Integrante' },
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const config = statusMap[status] || { bg: 'bg-gray-100', text: 'text-gray-700', label: status };
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-flex items-center font-medium rounded-full ${config.bg} ${config.text} ${sizeClasses}`}>
      {config.label}
    </span>
  );
};

export default StatusBadge;
