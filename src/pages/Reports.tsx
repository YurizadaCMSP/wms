import React, { useState } from 'react';
import {
  FileText,
  Download,
  Loader2,
  Package,
  ArrowUpRight,
  AlertTriangle,
  Users,
  ClipboardList,
} from 'lucide-react';
import Layout from '@/components/Layout';
import { useToast } from '@/contexts/ToastContext';
import { reportsAPI } from '@/services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const reportTypes = [
  { id: 'stock', label: 'Estoque', description: 'Relatorio completo do estoque atual', icon: Package },
  { id: 'loans', label: 'Emprestimos', description: 'Emprestimos por periodo', icon: ArrowUpRight },
  { id: 'occurrences', label: 'Ocorrencias', description: 'Todas as ocorrencias registradas', icon: AlertTriangle },
  { id: 'critical_stock', label: 'Estoque Critico', description: 'Produtos abaixo do minimo', icon: AlertTriangle },
  { id: 'users', label: 'Usuarios', description: 'Usuarios do sistema', icon: Users },
  { id: 'logs', label: 'Logs', description: 'Auditoria completa', icon: ClipboardList },
];

const Reports: React.FC = () => {
  const { addToast } = useToast();
  const [selectedType, setSelectedType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<unknown[] | null>(null);

  const generateReport = async (): Promise<void> => {
    if (!selectedType) {
      addToast('warning', 'Selecione um tipo de relatorio');
      return;
    }
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const { data } = await reportsAPI.generate(selectedType, params);
      setReportData(data.data);
      addToast('success', 'Relatorio gerado!');
    } catch {
      addToast('error', 'Erro ao gerar relatorio');
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = (): void => {
    if (!reportData) return;
    const doc = new jsPDF();
    const typeLabel = reportTypes.find((t) => t.id === selectedType)?.label || 'Relatorio';

    doc.setFontSize(18);
    doc.text(`Secretaria WMS - ${typeLabel}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30);

    if (reportData.length > 0) {
      const headers = Object.keys(reportData[0] as Record<string, unknown>);
      const body = reportData.map((row: unknown) =>
        headers.map((h) => {
          const val = (row as Record<string, unknown>)[h];
          return val !== null && val !== undefined ? String(val) : '';
        })
      );

      autoTable(doc, {
        head: [headers],
        body,
        startY: 40,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [212, 168, 67] },
      });
    }

    doc.save(`relatorio-${selectedType}-${Date.now()}.pdf`);
    addToast('success', 'PDF exportado!');
  };

  const exportExcel = (): void => {
    if (!reportData) return;
    const ws = XLSX.utils.json_to_sheet(reportData as Record<string, unknown>[]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Relatorio');
    XLSX.writeFile(wb, `relatorio-${selectedType}-${Date.now()}.xlsx`);
    addToast('success', 'Excel exportado!');
  };

  const exportCSV = (): void => {
    if (!reportData) return;
    const ws = XLSX.utils.json_to_sheet(reportData as Record<string, unknown>[]);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-${selectedType}-${Date.now()}.csv`;
    link.click();
    addToast('success', 'CSV exportado!');
  };

  return (
    <Layout title="Relatorios" subtitle="Geracao e exportacao de relatorios">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Selection */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Tipo de Relatorio</h3>
            <div className="space-y-2">
              {reportTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => { setSelectedType(type.id); setReportData(null); }}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left ${
                      selectedType === type.id
                        ? 'bg-amber-50 border border-amber-200'
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      selectedType === type.id ? 'bg-amber-100' : 'bg-gray-100'
                    }`}>
                      <Icon className={`w-5 h-5 ${selectedType === type.id ? 'text-amber-600' : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${selectedType === type.id ? 'text-amber-800' : 'text-gray-700'}`}>
                        {type.label}
                      </p>
                      <p className="text-xs text-gray-500">{type.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Periodo (opcional)</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Data inicial</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Data final</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-sm"
                />
              </div>
            </div>

            <button
              onClick={generateReport}
              disabled={loading}
              className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              Gerar Relatorio
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 min-h-[500px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {reportTypes.find((t) => t.id === selectedType)?.label || 'Preview'}
              </h3>
              {reportData && reportData.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={exportPDF}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> PDF
                  </button>
                  <button
                    onClick={exportExcel}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Excel
                  </button>
                  <button
                    onClick={exportCSV}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> CSV
                  </button>
                </div>
              )}
            </div>

            {!reportData ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <FileText className="w-12 h-12 mb-3" />
                <p className="text-sm">Selecione um tipo de relatorio e clique em Gerar</p>
              </div>
            ) : reportData.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-gray-400">
                <p className="text-sm">Nenhum dado encontrado para este periodo</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      {Object.keys(reportData[0] as Record<string, unknown>).map((key) => (
                        <th key={key} className="text-left py-2 px-3 font-medium text-gray-600 capitalize">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(reportData as Record<string, unknown>[]).slice(0, 50).map((row, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                        {Object.values(row).map((val, j) => (
                          <td key={j} className="py-2 px-3 text-gray-600">
                            {val !== null && val !== undefined
                              ? typeof val === 'object'
                                ? JSON.stringify(val).slice(0, 50)
                                : String(val).slice(0, 50)
                              : '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {reportData.length > 50 && (
                  <p className="text-xs text-gray-400 text-center mt-2">
                    Mostrando 50 de {reportData.length} registros. Exporte para ver todos.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Reports;
