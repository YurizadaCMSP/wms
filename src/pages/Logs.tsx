import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
} from 'lucide-react';
import Layout from '@/components/Layout';
import { useToast } from '@/contexts/ToastContext';
import { logsAPI } from '@/services/api';
import { useDebounce } from '@/hooks/useDebounce';
import type { LogEntry } from '@/types';

const actionLabels: Record<string, string> = {
  LOGIN: 'Login',
  LOGOUT: 'Logout',
  CREATE_USER: 'Criar Usuario',
  UPDATE_USER: 'Atualizar Usuario',
  DELETE_USER: 'Excluir Usuario',
  CREATE_PRODUCT: 'Criar Produto',
  UPDATE_PRODUCT: 'Atualizar Produto',
  DELETE_PRODUCT: 'Excluir Produto',
  CREATE_LOAN: 'Criar Emprestimo',
  CREATE_RETURN: 'Criar Devolucao',
  CREATE_OCCURRENCE: 'Criar Ocorrencia',
  ACKNOWLEDGE_OCCURRENCE: 'Marcar Ciente',
  PASSWORD_RESET: 'Redefinir Senha',
  PASSWORD_CHANGE: 'Alterar Senha',
};

const actionColors: Record<string, string> = {
  LOGIN: 'bg-emerald-100 text-emerald-700',
  LOGOUT: 'bg-gray-100 text-gray-700',
  CREATE_USER: 'bg-blue-100 text-blue-700',
  UPDATE_USER: 'bg-blue-100 text-blue-700',
  DELETE_USER: 'bg-red-100 text-red-700',
  CREATE_PRODUCT: 'bg-amber-100 text-amber-700',
  UPDATE_PRODUCT: 'bg-amber-100 text-amber-700',
  DELETE_PRODUCT: 'bg-red-100 text-red-700',
  CREATE_LOAN: 'bg-purple-100 text-purple-700',
  CREATE_RETURN: 'bg-emerald-100 text-emerald-700',
  CREATE_OCCURRENCE: 'bg-orange-100 text-orange-700',
  ACKNOWLEDGE_OCCURRENCE: 'bg-emerald-100 text-emerald-700',
  PASSWORD_RESET: 'bg-red-100 text-red-700',
  PASSWORD_CHANGE: 'bg-blue-100 text-blue-700',
};

const Logs: React.FC = () => {
  const { addToast } = useToast();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const debouncedSearch = useDebounce(search, 300);

  const fetchLogs = async () => {
    try {
      const params: Record<string, string> = { page: String(page), limit: '50' };
      if (debouncedSearch) params.search = debouncedSearch;
      if (actionFilter) params.action = actionFilter;

      const { data } = await logsAPI.getAll(params);
      setLogs(data.logs);
      setTotalPages(data.pages);
    } catch {
      addToast('error', 'Erro ao carregar logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [debouncedSearch, actionFilter, page]);

  return (
    <Layout title="Logs" subtitle="Auditoria completa do sistema">
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar por usuario, acao..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-sm"
            />
          </div>
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-sm"
          >
            <option value="">Todas acoes</option>
            {Object.entries(actionLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhum log encontrado</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Data/Hora</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Usuario</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Acao</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Alvo</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Detalhes</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-800">{log.user?.name || 'Sistema'}</p>
                      <p className="text-xs text-gray-500">{log.user?.email}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        actionColors[log.action] || 'bg-gray-100 text-gray-700'
                      }`}>
                        {actionLabels[log.action] || log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{log.target || '-'}</td>
                    <td className="py-3 px-4 text-gray-500 max-w-xs truncate">{log.details || '-'}</td>
                    <td className="py-3 px-4 text-gray-500 text-xs font-mono">{log.ip || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-200">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-600">Pagina {page} de {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
};

export default Logs;
