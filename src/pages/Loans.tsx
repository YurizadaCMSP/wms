import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
} from 'lucide-react';
import Layout from '@/components/Layout';
import StatusBadge from '@/components/StatusBadge';
import { useToast } from '@/contexts/ToastContext';
import { loansAPI, productsAPI } from '@/services/api';
import { onEvent } from '@/services/socket';
import { useDebounce } from '@/hooks/useDebounce';
import type { Loan, Product } from '@/types';
import { TEAMS } from '@/types';

const Loans: React.FC = () => {
  const { addToast } = useToast();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('history');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showNewLoan, setShowNewLoan] = useState(false);

  // New loan form
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariation, setSelectedVariation] = useState('');
  const [team, setTeam] = useState('');
  const [personName, setPersonName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [observation, setObservation] = useState('');
  const [productSearch, setProductSearch] = useState('');

  const debouncedSearch = useDebounce(search, 300);
  const debouncedProductSearch = useDebounce(productSearch, 300);

  const fetchLoans = async () => {
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter) params.status = statusFilter;

      const { data } = await loansAPI.getAll(params);
      setLoans(data.loans);
      setTotalPages(data.pages);
    } catch {
      addToast('error', 'Erro ao carregar emprestimos');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data } = await productsAPI.getAll({ search: debouncedProductSearch, limit: '20' });
      setProducts(data.products);
    } catch {
      // silently fail
    }
  };

  useEffect(() => {
    fetchLoans();
  }, [debouncedSearch, statusFilter, page]);

  useEffect(() => {
    fetchProducts();
  }, [debouncedProductSearch]);

  useEffect(() => {
    const unsub = onEvent('loan:created', () => fetchLoans());
    return unsub;
  }, []);

  const handleCreateLoan = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!selectedProduct || !team || !personName || quantity < 1) {
      addToast('warning', 'Preencha todos os campos obrigatorios');
      return;
    }

    try {
      await loansAPI.create({
        productId: selectedProduct._id,
        variation: selectedVariation || undefined,
        team,
        personName,
        quantity,
        observation,
      });
      addToast('success', 'Emprestimo registrado!');
      setShowNewLoan(false);
      resetForm();
      fetchLoans();
      setActiveTab('history');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      addToast('error', err.response?.data?.error || 'Erro ao criar emprestimo');
    }
  };

  const resetForm = (): void => {
    setSelectedProduct(null);
    setSelectedVariation('');
    setTeam('');
    setPersonName('');
    setQuantity(1);
    setObservation('');
    setProductSearch('');
  };

  const getAvailableQuantity = (): number => {
    if (!selectedProduct) return 0;
    if (selectedVariation && selectedProduct.variations?.length > 0) {
      const v = selectedProduct.variations.find((v) => v.name === selectedVariation);
      return v?.quantity || 0;
    }
    return selectedProduct.quantity;
  };

  return (
    <Layout title="Emprestimos" subtitle="Controle de materiais emprestados">
      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'history'
                ? 'text-amber-600 border-b-2 border-amber-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Historico
          </button>
          <button
            onClick={() => { setActiveTab('new'); setShowNewLoan(true); }}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'new'
                ? 'text-amber-600 border-b-2 border-amber-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Novo Emprestimo
          </button>
        </div>

        {activeTab === 'history' && (
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
                <option value="active">Ativo</option>
                <option value="returned">Devolvido</option>
                <option value="partial">Parcial</option>
              </select>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
              </div>
            ) : loans.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Nenhum emprestimo encontrado</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 font-medium text-gray-600">Material</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-600">Equipe</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-600">Pessoa</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-600">Qtd</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-600">Status</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-600">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loans.map((loan) => (
                        <tr key={loan._id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2 px-3">
                            <p className="font-medium text-gray-800">{loan.product?.name}</p>
                            {loan.variation && <p className="text-xs text-gray-500">{loan.variation}</p>}
                          </td>
                          <td className="py-2 px-3 text-gray-600">{loan.team}</td>
                          <td className="py-2 px-3 text-gray-600">{loan.personName}</td>
                          <td className="py-2 px-3 text-gray-800 font-medium">{loan.quantity}</td>
                          <td className="py-2 px-3">
                            <StatusBadge status={loan.status} />
                          </td>
                          <td className="py-2 px-3 text-gray-500 text-xs">
                            {new Date(loan.createdAt).toLocaleDateString('pt-BR')}
                          </td>
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
            <form onSubmit={handleCreateLoan} className="max-w-lg space-y-4">
              {/* Product Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Produto *</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Pesquisar produto..."
                    value={selectedProduct ? selectedProduct.name : productSearch}
                    onChange={(e) => { setProductSearch(e.target.value); setSelectedProduct(null); }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
                {!selectedProduct && products.length > 0 && productSearch && (
                  <div className="mt-1 border border-gray-200 rounded-lg max-h-40 overflow-y-auto bg-white shadow-lg">
                    {products.map((p) => (
                      <button
                        key={p._id}
                        type="button"
                        onClick={() => { setSelectedProduct(p); setProductSearch(''); setSelectedVariation(''); }}
                        className="w-full text-left px-4 py-2 hover:bg-amber-50 text-sm border-b border-gray-100 last:border-0"
                      >
                        <p className="font-medium text-gray-800">{p.name}</p>
                        <p className="text-xs text-gray-500">Estoque: {p.quantity} | {p.storageLocation}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Variation */}
              {selectedProduct?.variations && selectedProduct.variations.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Variacao</label>
                  <select
                    value={selectedVariation}
                    onChange={(e) => setSelectedVariation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="">Selecione...</option>
                    {selectedProduct.variations.map((v) => (
                      <option key={v.name} value={v.name}>{v.name} ({v.quantity} disp.)</option>
                    ))}
                  </select>
                </div>
              )}

              {selectedProduct && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-sm text-amber-800">
                    <span className="font-medium">Estoque disponivel:</span> {getAvailableQuantity()} unidades
                  </p>
                  <p className="text-xs text-amber-600">Local: {selectedProduct.storageLocation || 'Nao informado'}</p>
                </div>
              )}

              {/* Team */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Equipe *</label>
                <select
                  required
                  value={team}
                  onChange={(e) => setTeam(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="">Selecione a equipe...</option>
                  {TEAMS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Person Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome (como no cracha) *</label>
                <input
                  type="text"
                  required
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  placeholder="Nome da pessoa"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade *</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={getAvailableQuantity()}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              {/* Observation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observacao (opcional)</label>
                <textarea
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors font-medium"
              >
                <ArrowUpRight className="w-4 h-4" /> Confirmar Emprestimo
              </button>
            </form>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Loans;
