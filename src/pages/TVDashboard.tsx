import React, { useState, useEffect } from 'react';
import {
  Package,
  ArrowUpRight,
  CheckCircle,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { dashboardAPI } from '@/services/api';
import { onEvent } from '@/services/socket';
import type { DashboardStats, Loan } from '@/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const TVDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<{ _id: string; total: number }[]>([]);
  const [recentLoans, setRecentLoans] = useState<Loan[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  const fetchData = async () => {
    try {
      const [statsRes, chartsRes, loansRes] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getCharts(),
        dashboardAPI.getRecentLoans(),
      ]);
      setStats(statsRes.data);
      setChartData(chartsRes.data.stockByCategory);
      setRecentLoans(loansRes.data);
    } catch (error) {
      console.error('Error fetching TV data:', error);
    }
  };

  useEffect(() => {
    fetchData();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const unsub1 = onEvent('stock:updated', () => fetchData());
    const unsub2 = onEvent('loan:created', () => fetchData());
    return () => {
      clearInterval(timer);
      unsub1();
      unsub2();
    };
  }, []);

  // Auto refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const kpiCards = [
    { label: 'Total de Produtos', value: stats?.totalProducts || 0, icon: Package, color: 'text-amber-400' },
    { label: 'Emprestados', value: stats?.activeLoans || 0, icon: ArrowUpRight, color: 'text-orange-400' },
    { label: 'Disponiveis', value: stats?.availableProducts || 0, icon: CheckCircle, color: 'text-emerald-400' },
    { label: 'Ocorrencias Pendentes', value: stats?.pendingOccurrences || 0, icon: AlertTriangle, color: 'text-red-400' },
  ];

  return (
    <div className="min-h-screen bg-[#1E1E2D] text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">EJC Cocaia 2026</h1>
          <p className="text-gray-400 text-lg">Secretaria WMS - Painel em Tempo Real</p>
        </div>
        <div className="text-right">
          <p className="text-4xl font-bold text-amber-400">
            {currentTime.toLocaleTimeString('pt-BR')}
          </p>
          <p className="text-gray-400">
            {currentTime.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpiCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="bg-[#2A2A3D] rounded-2xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <Icon className={`w-8 h-8 ${card.color}`} />
                <span className={`text-5xl font-bold ${card.color}`}>
                  {card.value.toLocaleString()}
                </span>
              </div>
              <p className="text-gray-400 text-lg">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Stock by Category */}
        <div className="bg-[#2A2A3D] rounded-2xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Estoque por Categoria</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3A3A4D" />
              <XAxis dataKey="_id" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
              <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#2A2A3D', border: '1px solid #4A4A5D', borderRadius: 8, color: '#fff' }}
              />
              <Bar dataKey="total" fill="#D4A843" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Loans */}
        <div className="bg-[#2A2A3D] rounded-2xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Ultimos Emprestimos</h2>
          <div className="space-y-3">
            {recentLoans.length === 0 && (
              <p className="text-gray-500 text-center py-8">Nenhum emprestimo recente</p>
            )}
            {recentLoans.map((loan) => (
              <div key={loan._id} className="flex items-center justify-between py-3 border-b border-gray-700 last:border-0">
                <div>
                  <p className="font-medium text-white text-lg">{loan.product?.name}</p>
                  <p className="text-gray-400 text-sm">{loan.personName} - {loan.team}</p>
                </div>
                <div className="text-right">
                  <span className="text-amber-400 font-bold text-xl">{loan.quantity}</span>
                  <p className="text-gray-500 text-xs">unidades</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Critical Stock Alert */}
      {(stats?.lowStockProducts || 0) > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <h2 className="text-xl font-semibold text-red-400">Alerta de Estoque Critico</h2>
          </div>
          <p className="text-gray-400">
            {stats?.lowStockProducts} produtos com estoque abaixo do minimo e{' '}
            {stats?.outOfStockProducts} produtos sem estoque.
          </p>
        </div>
      )}

      {/* Footer ticker */}
      <div className="fixed bottom-0 left-0 right-0 bg-amber-500 text-white py-2 overflow-hidden">
        <div className="flex items-center gap-8 animate-marquee whitespace-nowrap">
          <span className="font-medium">Secretaria WMS - EJC Cocaia 2026</span>
          <span>|</span>
          <span>Sistema em tempo real</span>
          <span>|</span>
          <span>Total: {stats?.totalProducts || 0} produtos</span>
          <span>|</span>
          <span>Emprestimos ativos: {stats?.activeLoans || 0}</span>
          <span>|</span>
          <span>Ocorrencias pendentes: {stats?.pendingOccurrences || 0}</span>
        </div>
      </div>
    </div>
  );
};

export default TVDashboard;
