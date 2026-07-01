import React, { useState, useEffect } from 'react';
import {
  Search,
  ArrowDownLeft,
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Layout from '@/components/Layout';
import { useToast } from '@/contexts/ToastContext';
import { loansAPI, returnsAPI } from '@/services/api';
import { onEvent } from '@/services/socket';
import { useDebounce } from '@/hooks/useDebounce';
import type { Loan } from '@/types';
import { TEAMS } from '@/types';

const Returns: React.FC = () => {
  const { addToast } = useToast();
  const [activeLoans, setActiveLoans] = useState<Loan[]>([]);
  const [filteredLoans, setFilteredLoans] = useState<Loan[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Return form
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [returnQuantity, setReturnQuantity] = useState(1);
  const [returnedBy, setReturnedBy] = useState('');
  const [returnTeam, setReturnTeam] = useState('');
  const [notes, setNotes] = useState('');
  const [showWarnings, setShowWarnings] = useState({ team: false, quantity: false });
  const [processing, setProcessing] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  const fetchActiveLoans = async () => {
    try {
      const { data } = await loansAPI.getActive();
      setActiveLoans(data);
      setFilteredLoans(data);
    } catch {
      addToast('error', 'Erro ao carregar emprestimos ativos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveLoans();
  }, []);

  useEffect(() => {
    const filtered = activeLoans.filter(
      (l) =>
        l.product?.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        l.personName?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        l.team?.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
    setFilteredLoans(filtered);
  }, [debouncedSearch, activeLoans]);

  useEffect(() => {
    const unsub = onEvent('loan:updated', () => fetchActiveLoans());
    return unsub;
  }, []);

  const handleReturn = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!selectedLoan || returnQuantity < 1 || !returnedBy || !returnTeam) {
      addToast('warning', 'Preencha todos os campos');
      return;
    }

    const remainingQty = selectedLoan.quantity - selectedLoan.returnedQuantity;

    if (returnQuantity > remainingQty) {
      addToast('error', `Quantidade maxima: ${remainingQty}`);
      return;
    }

    // Check warnings
    const warnings = { team: false, quantity: false };
    if (returnTeam !== selectedLoan.team) warnings.team = true;
    if (returnQuantity < remainingQty) warnings.quantity = true;

    if ((warnings.team || warnings.quantity) && !showWarnings.team && !showWarnings.quantity) {
      setShowWarnings(warnings);
      return;
    }

    setProcessing(true);
    try {
      await returnsAPI.create({
        loanId: selectedLoan._id,
        quantity: returnQuantity,
        returnedBy,
        returnTeam,
        notes,
      });
      addToast('success', 'Devolucao processada com sucesso!');
      setSelectedLoan(null);
      resetForm();
      fetchActiveLoans();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      addToast('error', err.response?.data?.error || 'Erro ao processar devolucao');
    } finally {
      setProcessing(false);
      setShowWarnings({ team: false, quantity: false });
    }
  };

  const resetForm = (): void => {
    setReturnQuantity(1);
    setReturnedBy('');
    setReturnTeam('');
    setNotes('');
    setShowWarnings({ team: false, quantity: false });
  };

  return (
    <Layout title="Devolucoes" subtitle="Processar devolucoes de materiais">
      {!selectedLoan ? (
        <>
          {/* Search */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Pesquisar por material, equipe, pessoa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-sm"
              />
            </div>
          </div>

          {/* Active Loans List */}
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
            </div>
          ) : filteredLoans.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <ArrowDownLeft className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Nenhum emprestimo ativo encontrado</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLoans.map((loan) => {
                const remaining = loan.quantity - loan.returnedQuantity;
                return (
                  <div
                    key={loan._id}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-800">{loan.product?.name}</h3>
                        {loan.variation && (
                          <p className="text-xs text-gray-500">{loan.variation}</p>
                        )}
                      </div>
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                        {loan.status === 'partial' ? 'Parcial' : 'Ativo'}
                      </span>
                    </div>

                    <div className="space-y-1.5 mb-4 text-sm">
                      <p className="text-gray-600">
                        <span className="text-gray-400">Retirado por:</span> {loan.personName}
                      </p>
                      <p className="text-gray-600">
                        <span className="text-gray-400">Equipe:</span> {loan.team}
                      </p>
                      <p className="text-gray-600">
                        <span className="text-gray-400">Quantidade:</span>{' '}
                        <span className="font-medium">{loan.quantity}</span>
                        {loan.status === 'partial' && (
                          <span className="text-gray-400"> (devolvido: {loan.returnedQuantity})</span>
                        )}
                      </p>
                      <p className="text-gray-600">
                        <span className="text-gray-400">Data:</span>{' '}
                        {new Date(loan.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>

                    <button
                      onClick={() => { setSelectedLoan(loan); setReturnQuantity(remaining); }}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                      <ArrowDownLeft className="w-4 h-4" /> Processar Devolucao
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* Return Form */
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => { setSelectedLoan(null); resetForm(); }}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ChevronLeft className="w-4 h-4" /> Voltar
          </button>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Processar Devolucao</h3>

            {/* Loan Details */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2 text-sm">
              <p><span className="text-gray-500">Material:</span> <span className="font-medium">{selectedLoan.product?.name}</span></p>
              {selectedLoan.variation && <p><span className="text-gray-500">Variacao:</span> {selectedLoan.variation}</p>}
              <p><span className="text-gray-500">Quem retirou:</span> {selectedLoan.personName}</p>
              <p><span className="text-gray-500">Equipe original:</span> {selectedLoan.team}</p>
              <p><span className="text-gray-500">Quantidade emprestada:</span> {selectedLoan.quantity}</p>
              <p><span className="text-gray-500">Ja devolvido:</span> {selectedLoan.returnedQuantity}</p>
              <p><span className="text-gray-500">Restante:</span> <span className="font-medium text-amber-600">{selectedLoan.quantity - selectedLoan.returnedQuantity}</span></p>
            </div>

            {/* Warnings */}
            {(showWarnings.team || showWarnings.quantity) && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    {showWarnings.team && (
                      <p className="text-sm text-amber-800">Equipe diferente da retirada. Deseja continuar?</p>
                    )}
                    {showWarnings.quantity && (
                      <p className="text-sm text-amber-800">Quantidade menor que o emprestado. Ocorrencia sera criada automaticamente.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleReturn} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade devolvida *</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={selectedLoan.quantity - selectedLoan.returnedQuantity}
                  value={returnQuantity}
                  onChange={(e) => setReturnQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quem devolveu *</label>
                <input
                  type="text"
                  required
                  value={returnedBy}
                  onChange={(e) => setReturnedBy(e.target.value)}
                  placeholder="Nome de quem esta devolvendo"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Equipe que devolve *</label>
                <select
                  required
                  value={returnTeam}
                  onChange={(e) => setReturnTeam(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="">Selecione...</option>
                  {TEAMS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observacoes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={processing}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowDownLeft className="w-4 h-4" />}
                {processing ? 'Processando...' : 'Confirmar Devolucao'}
              </button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Returns;
