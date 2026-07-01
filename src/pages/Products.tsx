import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Package,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Layout from '@/components/Layout';
import StatusBadge from '@/components/StatusBadge';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { productsAPI } from '@/services/api';
import { onEvent } from '@/services/socket';
import { useDebounce } from '@/hooks/useDebounce';
import type { Product, Variation } from '@/types';

const Products: React.FC = () => {
  const { hasRole } = useAuthContext();
  const { addToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    storageLocation: '',
    quantity: 0,
    minimumQuantity: 1,
    variations: [] as Variation[],
  });

  const debouncedSearch = useDebounce(search, 300);

  const fetchProducts = async () => {
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      if (debouncedSearch) params.search = debouncedSearch;
      if (categoryFilter) params.category = categoryFilter;
      if (statusFilter) params.status = statusFilter;

      const { data } = await productsAPI.getAll(params);
      setProducts(data.products);
      setTotalPages(data.pages);
    } catch {
      addToast('error', 'Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await productsAPI.getCategories();
      setCategories(data);
    } catch {
      // silently fail
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [debouncedSearch, categoryFilter, statusFilter, page]);

  useEffect(() => {
    fetchCategories();
    const unsub = onEvent('stock:updated', () => fetchProducts());
    return unsub;
  }, []);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await productsAPI.update(editingProduct._id, formData);
        addToast('success', 'Produto atualizado!');
      } else {
        await productsAPI.create(formData);
        addToast('success', 'Produto criado!');
      }
      setShowModal(false);
      setEditingProduct(null);
      resetForm();
      fetchProducts();
    } catch {
      addToast('error', 'Erro ao salvar produto');
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!deleteId) return;
    try {
      await productsAPI.delete(deleteId);
      addToast('success', 'Produto excluido!');
      setDeleteId(null);
      fetchProducts();
    } catch {
      addToast('error', 'Erro ao excluir produto');
    }
  };

  const openEdit = (product: Product): void => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      description: product.description || '',
      storageLocation: product.storageLocation || '',
      quantity: product.quantity,
      minimumQuantity: product.minimumQuantity,
      variations: product.variations || [],
    });
    setShowModal(true);
  };

  const resetForm = (): void => {
    setFormData({
      name: '',
      category: '',
      description: '',
      storageLocation: '',
      quantity: 0,
      minimumQuantity: 1,
      variations: [],
    });
  };

  const addVariation = (): void => {
    setFormData((prev) => ({
      ...prev,
      variations: [...prev.variations, { name: '', quantity: 0 }],
    }));
  };

  const removeVariation = (index: number): void => {
    setFormData((prev) => ({
      ...prev,
      variations: prev.variations.filter((_, i) => i !== index),
    }));
  };

  const updateVariation = (index: number, field: keyof Variation, value: string | number): void => {
    setFormData((prev) => ({
      ...prev,
      variations: prev.variations.map((v, i) => (i === index ? { ...v, [field]: value } : v)),
    }));
  };

  const getStockStatus = (product: Product): string => {
    if (product.quantity === 0) return 'out_of_stock';
    if (product.quantity <= product.minimumQuantity) return 'low_stock';
    return 'in_stock';
  };

  return (
    <Layout title="Produtos" subtitle="Gerenciamento de estoque">
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar por nome, codigo, categoria..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-sm"
          >
            <option value="">Todas categorias</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-sm"
          >
            <option value="">Todos status</option>
            <option value="in_stock">Em estoque</option>
            <option value="low_stock">Baixo estoque</option>
            <option value="out_of_stock">Sem estoque</option>
          </select>
          {hasRole('admin', 'coordinator') && (
            <button
              onClick={() => { setEditingProduct(null); resetForm(); setShowModal(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> Novo Produto
            </button>
          )}
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhum produto encontrado</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((product) => (
              <div
                key={product._id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-amber-500" />
                  </div>
                  <StatusBadge status={getStockStatus(product)} />
                </div>

                <h3 className="font-semibold text-gray-800 mb-1 truncate">{product.name}</h3>
                <p className="text-xs text-gray-500 font-mono mb-2">{product.internalCode}</p>

                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{product.category}</span>
                  {product.storageLocation && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{product.storageLocation}</span>
                  )}
                </div>

                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-lg font-bold text-gray-800">{product.quantity}</p>
                    <p className="text-xs text-gray-400">unidades</p>
                  </div>
                  {product.variations?.length > 0 && (
                    <span className="text-xs text-gray-500">{product.variations.length} variacoes</span>
                  )}
                </div>

                {hasRole('admin', 'coordinator') && (
                  <div className="flex gap-2 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => openEdit(product)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 text-sm text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Editar
                    </button>
                    <button
                      onClick={() => setDeleteId(product._id)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Excluir
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-600">Pagina {page} de {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Product Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto animate-scaleIn">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
                <input
                  type="text"
                  required
                  list="categories"
                  value={formData.category}
                  onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                />
                <datalist id="categories">
                  {categories.map((c) => <option key={c} value={c} />)}
                </datalist>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Local de Armazenamento</label>
                  <input
                    type="text"
                    value={formData.storageLocation}
                    onChange={(e) => setFormData((p) => ({ ...p, storageLocation: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Qtd. Minima</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.minimumQuantity}
                    onChange={(e) => setFormData((p) => ({ ...p, minimumQuantity: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descricao</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              {/* Variations */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Variacoes</label>
                  <button
                    type="button"
                    onClick={addVariation}
                    className="text-xs text-amber-600 hover:text-amber-700 font-medium"
                  >
                    + Adicionar
                  </button>
                </div>
                {formData.variations.map((v, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Nome (ex: Azul)"
                      value={v.name}
                      onChange={(e) => updateVariation(i, 'name', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-sm"
                    />
                    <input
                      type="number"
                      min={0}
                      placeholder="Qtd"
                      value={v.quantity}
                      onChange={(e) => updateVariation(i, 'quantity', Number(e.target.value))}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeVariation(i)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors font-medium"
                >
                  {editingProduct ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        title="Excluir Produto"
        message="Tem certeza que deseja excluir este produto? Esta acao nao pode ser desfeita."
        confirmLabel="Excluir"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </Layout>
  );
};

export default Products;
