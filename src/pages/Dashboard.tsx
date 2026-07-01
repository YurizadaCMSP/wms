import React, { useState, useEffect } from 'react';
import {
  Package,
  ArrowUpRight,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Clock,
} from 'lucide-react';
import Layout from '@/components/Layout';
import KpiCard from '@/components/KpiCard';
import StatusBadge from '@/components/StatusBadge';
import { dashboardAPI } from '@/services/api';
import { onEvent } from '@/services/socket';
import type { DashboardStats, ChartData, Loan, Return } from '@/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [recentLoans, setRecentLoans] = useState<Loan[]>([]);
  const [recentReturns, setRecentReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [statsRes, chartsRes, loansRes, returnsRes] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getCharts(),
        dashboardAPI.getRecentLoans(),
        dashboardAPI.getRecentReturns(),
      ]);
      setStats(statsRes.data);
      setChartData(chartsRes.data);
      setRecentLoans(loansRes.data);
      setRecentReturns(returnsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const unsubStock = onEvent('stock:updated', () => fetchData());
    const unsubLoan = onEvent('loan:created', () => fetchData());
    const unsubReturn = onEvent('return:created', () => fetchData());
    return () => {
      unsubStock();
      unsubLoan();
      unsubReturn();
    };
  }, []);

  if (loading) {
    return (
      <Layout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  const loanStatusData = chartData?.loanStatus?.map((s) => ({
    name: s._id === 'active' ? 'Ativo' : s._id === 'returned' ? 'Devolvido' : 'Parcial',
    value: s.count,
  })) || [];

  const COLORS = ['#F59E0B', '#10B981', '#F97316'];

  return (
    <Layout title="Dashboard" subtitle="Visao geral do sistema">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          title="Total de Produtos"
          value={stats?.totalProducts || 0}
          subtitle="Cadastrados"
          icon={Package}
          color="amber"
        />
        <KpiCard
          title="Emprestados"
          value={stats?.activeLoans || 0}
          subtitle="Em uso"
          icon={ArrowUpRight}
          color="orange"
        />
        <KpiCard
          title="Disponiveis"
          value={stats?.availableProducts || 0}
          subtitle="Em estoque"
          icon={CheckCircle}
          color="emerald"
        />
        <KpiCard
          title="Ocorrencias"
          value={stats?.pendingOccurrences || 0}
          subtitle="Pendentes"
          icon={AlertTriangle}
          color="red"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Stock by Category */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Estoque por Categoria</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData?.stockByCategory || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="_id" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey="total" fill="#D4A843" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Loan Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Status dos Emprestimos</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={loanStatusData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {loanStatusData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {loanStatusData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                <span className="text-xs text-gray-600">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Loans */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Ultimos Emprestimos</h3>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {recentLoans.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">Nenhum emprestimo recente</p>
            )}
            {recentLoans.map((loan) => (
              <div key={loan._id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">{loan.product?.name || 'Material'}</p>
                  <p className="text-xs text-gray-500">{loan.personName} - {loan.team}</p>
                </div>
                <div className="text-right">
                  <StatusBadge status={loan.status} />
                  <p className="text-xs text-gray-400 mt-1">{loan.quantity} unid.</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Returns */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Ultimas Devolucoes</h3>
            <Clock className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {recentReturns.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">Nenhuma devolucao recente</p>
            )}
            {recentReturns.map((ret) => (
              <div key={ret._id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">{ret.loan?.product?.name || 'Material'}</p>
                  <p className="text-xs text-gray-500">{ret.returnedBy} - {ret.returnTeam}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-medium text-emerald-600">{ret.quantity} unid.</span>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(ret.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
