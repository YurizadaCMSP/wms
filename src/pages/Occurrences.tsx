import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  CheckCircle,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import Layout from '@/components/Layout';
import StatusBadge from '@/components/StatusBadge';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { occurrencesAPI, productsAPI } from '@/services/api';
import { onEvent } from '@/services/socket';
import { useDebounce } from '@/hooks/useDebounce';
import type { Occurrence, Product } from '@/types';
import { TEAMS } from '@/types';

const Occurrences: React.FC = () => {
  const { hasRole } = useAuthContext();
  const { addToast } = useToast();
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<'list' | 'new'>('list');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // New occurrence form
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [description, setDescription] = useState('');
  const [team, setTeam] = useState('');
  const [personName, setPersonName] = useState('');
  const [productSearch, setProductSearch] = useState('');

  const debouncedSearch = useDebounce(search, 300);

  const fetchOccurrences = async () => {
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter) params.status = statusFilter;

      const { data } = await occurrencesAPI.getAll(params);
      setOccurrences(data.occurrences);
      setTotalPages(data.pages);
    } catch {
      addToast('error', 'Erro ao carregar ocorrencias');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data } = await productsAPI.getAll({ limit: '100' });
      setProducts(data.products);
    } catch {
      // silently fail
    }
  };

  useEffect(() => {
    fetchOccurrences();
  }, [debouncedSearch, statusFilter, page]);

  useEffect(() => {
    fetchProducts();
    const unsub1 = onEvent('occurrence:created', () => fetchOccurrences());
    const unsub2 = onEvent('occurrence:acknowledged', () => fetchOccurrences());
    return () => { unsub1(); unsub2(); };
  }, []);

  const handleCreate = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!productId || !description || !team || !personName || quantity < 1) {
      addToast('warning', 'Preencha todos os campos obrigatorios');
      return;
    }
    try {
      await occurrencesAPI.create({ product: productId, quantity, description, team, personName });
      addToast('success', 'Ocorrencia registrada!');
      setActiveTab('list');
      resetForm();
      fetchOccurrences();
    } catch {
      addToast('error', 'Erro ao registrar ocorrencia');
    }
  };

  const handleAcknowledge = async (id: string): Promise<void> => {
    try {
      await occurrencesAPI.acknowledge(id);
      addToast('success', 'Ocorrencia marcada como ciente!');
      fetchOccurrences();
    } catch {
      addToast('error', 'Erro ao marcar ocorrencia');
    }
  };

  const resetForm = (): void => {
    setProductId('');
    setQuantity(1);
    setDescription('');
    setTeam('');
    setPersonName('');
    setProductSearch('');
  };

  return (
    <Layout title="Ocorrencias" subtitle="Registro e gestao de ocorrencias">
      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'list'
                ? 'text-amber-600 border-b-2 border-amber-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Lista de Ocorrencias
          </button>
          <button
            onClick={() => setActiveTab('new')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'new'
                ? 'text-amber-600 border-b-2 border-amber-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Nova Ocorrencia
          </button>
        </div>

        {activeTab === 'list' && (
          <div className="p-4">
            <div className="flex flex-col md:flex-row gap-3 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Pesquisar..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-sm"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-sm"
              >
                <option value="">Todos status</option>
                <option value="pending">Pendente</option>
                <option value="acknowledged">Ciente</option>
              </select>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
              </div>
            ) : occurrences.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Nenhuma ocorrencia encontrada</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 font-medium text-gray-600">ID</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-600">Material</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-600">Qtd</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-600">Equipe</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-600">Status</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-600">Data</th>
                        {hasRole('admin', 'coordinator') && <th className="text-left py-2 px-3 font-medium text-gray-600">Acoes</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {occurrences.map((occ) => (
                        <tr key={occ._id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2 px-3 font-mono text-xs text-gray-500">
                            {occ._id.slice(-6)}
                          </td>
                          <td className="py-2 px-3">
                            <p className="font-medium text-gray-800">{occ.product?.name}</p>
                            <p className="text-xs text-gray-500">{occ.description?.slice(0, 50)}...</p>
                          </td>
                          <td className="py-2 px-3 text-gray-800 font-medium">{occ.quantity}</td>
                          <td className="py-2 px-3 text-gray-600">{occ.team}</td>
                          <td className="py-2 px-3">
                            <StatusBadge status={occ.status} />
                          </td>
                          <td className="py-2 px-3 text-gray-500 text-xs">
                            {new Date(occ.createdAt).toLocaleDateString('pt-BR')}
                          </td>
                          {hasRole('admin', 'coordinator') && (
                            <td className="py-2 px-3">
                              {occ.status === 'pending' ? (
                                <button
                                  onClick={() => handleAcknowledge(occ._id)}
                                  className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded transition-colors"
                                >
                                  <CheckCircle className="w-3 h-3" /> Ciente
                                </button>
                              ) : (
                                <span className="text-xs text-gray-400">
                                  {occ.acknowledgedBy?.name || 'Coordenador'}
                                </span>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-gray-600">{page} / {totalPages}</span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'new' && (
          <div className="p-6">
            <form onSubmit={handleCreate} className="max-w-lg space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Material *</label>
                <select
                  required
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="">Selecione...</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>{p.name} (Estoque: {p.quantity})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Equipe *</label>
                <select
                  required
                  value={team}
                  onChange={(e) => setTeam(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="">Selecione...</option>
                  {TEAMS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pessoa *</label>
                <input
                  type="text"
                  required
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  placeholder="Nome da pessoa"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descricao *</label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Descreva a ocorrencia..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors font-medium"
              >
                <AlertTriangle className="w-4 h-4" /> Registrar Ocorrencia
              </button>
            </form>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Occurrences;
