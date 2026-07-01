import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Mail,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Shield,
  UserPlus,
} from 'lucide-react';
import Layout from '@/components/Layout';
import StatusBadge from '@/components/StatusBadge';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { usersAPI } from '@/services/api';
import type { User } from '@/types';

const Settings: React.FC = () => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'users' | 'smtp'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // User form
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'coordinator' as 'coordinator' | 'member',
    team: '',
  });

  const fetchUsers = async () => {
    try {
      const { data } = await usersAPI.getAll({ page: String(page), limit: '20' });
      setUsers(data);
      setTotalPages(1);
    } catch {
      addToast('error', 'Erro ao carregar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const handleCreateUser = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    try {
      if (editingUser) {
        await usersAPI.update(editingUser._id, formData);
        addToast('success', 'Usuario atualizado!');
      } else {
        await usersAPI.create(formData);
        addToast('success', 'Usuario criado! Senha enviada por email.');
      }
      setShowUserForm(false);
      setEditingUser(null);
      resetForm();
      fetchUsers();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      addToast('error', err.response?.data?.error || 'Erro ao salvar usuario');
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!deleteId) return;
    try {
      await usersAPI.delete(deleteId);
      addToast('success', 'Usuario desativado!');
      setDeleteId(null);
      fetchUsers();
    } catch {
      addToast('error', 'Erro ao desativar usuario');
    }
  };

  const handleResetPassword = async (id: string): Promise<void> => {
    try {
      await usersAPI.resetPassword(id);
      addToast('success', 'Nova senha enviada por email!');
    } catch {
      addToast('error', 'Erro ao redefinir senha');
    }
  };

  const openEdit = (user: User): void => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role as 'coordinator' | 'member',
      team: user.team || '',
    });
    setShowUserForm(true);
  };

  const resetForm = (): void => {
    setFormData({ name: '', email: '', role: 'coordinator', team: '' });
  };

  return (
    <Layout title="Configuracoes" subtitle="Gerenciamento do sistema">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === 'users'
              ? 'text-amber-600 border-b-2 border-amber-500'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" /> Usuarios
          </div>
        </button>
      </div>

      {activeTab === 'users' && (
        <>
          {!showUserForm ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Usuarios do Sistema</h3>
                <button
                  onClick={() => { setEditingUser(null); resetForm(); setShowUserForm(true); }}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  <UserPlus className="w-4 h-4" /> Novo Usuario
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Nome</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Email</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Perfil</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Equipe</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Acoes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium text-gray-800">{user.name}</td>
                            <td className="py-3 px-4 text-gray-600">{user.email}</td>
                            <td className="py-3 px-4">
                              <StatusBadge status={user.role} />
                            </td>
                            <td className="py-3 px-4 text-gray-600">{user.team || '-'}</td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {user.isActive ? 'Ativo' : 'Inativo'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => openEdit(user)}
                                  className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                                  title="Editar"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleResetPassword(user._id)}
                                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                  title="Redefinir senha"
                                >
                                  <RefreshCw className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setDeleteId(user._id)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Desativar"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-200">
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
                </div>
              )}
            </>
          ) : (
            <div className="max-w-lg bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {editingUser ? 'Editar Usuario' : 'Novo Usuario'}
              </h3>

              <form onSubmit={handleCreateUser} className="space-y-4">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Perfil *</label>
                  <select
                    required
                    value={formData.role}
                    onChange={(e) => setFormData((p) => ({ ...p, role: e.target.value as 'coordinator' | 'member' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="coordinator">Coordenador</option>
                    <option value="member">Integrante</option>
                  </select>
                </div>

                {formData.role === 'member' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Equipe</label>
                    <input
                      type="text"
                      value={formData.team}
                      onChange={(e) => setFormData((p) => ({ ...p, team: e.target.value }))}
                      placeholder="Nome da equipe"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                )}

                {!editingUser && (
                  <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                    Uma senha aleatoria sera gerada e enviada por email para o usuario.
                  </p>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowUserForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors font-medium"
                  >
                    {editingUser ? 'Atualizar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Desativar Usuario"
        message="Tem certeza que deseja desativar este usuario? Ele nao podera mais acessar o sistema."
        confirmLabel="Desativar"
        variant="warning"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </Layout>
  );
};

export default Settings;
