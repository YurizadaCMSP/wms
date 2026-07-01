import React, { useState } from 'react';
import { Link, useLocation } from 'react-router';
import {
  LayoutDashboard,
  Package,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
  FileText,
  ClipboardList,
  Monitor,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Boxes,
} from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles: string[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: <LayoutDashboard className="w-5 h-5" />, roles: ['admin', 'coordinator', 'member'] },
  { label: 'Produtos', path: '/products', icon: <Package className="w-5 h-5" />, roles: ['admin', 'coordinator', 'member'] },
  { label: 'Emprestimos', path: '/loans', icon: <ArrowUpRight className="w-5 h-5" />, roles: ['admin', 'coordinator', 'member'] },
  { label: 'Devolucoes', path: '/returns', icon: <ArrowDownLeft className="w-5 h-5" />, roles: ['admin', 'coordinator', 'member'] },
  { label: 'Ocorrencias', path: '/occurrences', icon: <AlertTriangle className="w-5 h-5" />, roles: ['admin', 'coordinator', 'member'] },
  { label: 'Relatorios', path: '/reports', icon: <FileText className="w-5 h-5" />, roles: ['admin', 'coordinator'] },
  { label: 'Logs', path: '/logs', icon: <ClipboardList className="w-5 h-5" />, roles: ['admin', 'coordinator'] },
  { label: 'TV Mode', path: '/tv', icon: <Monitor className="w-5 h-5" />, roles: ['admin', 'coordinator', 'member'] },
  { label: 'Configuracoes', path: '/settings', icon: <Settings className="w-5 h-5" />, roles: ['admin'] },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const location = useLocation();
  const { user, logout, hasRole } = useAuthContext();
  const [mobileOpen, setMobileOpen] = useState(false);

  const filteredNavItems = navItems.filter((item) => hasRole(...item.roles));

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-800">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
              <Boxes className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-sm leading-tight">Secretaria WMS</h1>
              <p className="text-gray-400 text-[10px]">EJC Cocaia 2026</p>
            </div>
          </div>
        )}
        {isCollapsed && (
          <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center mx-auto">
            <Boxes className="w-5 h-5 text-white" />
          </div>
        )}
        <button
          onClick={onToggle}
          className="hidden lg:flex text-gray-400 hover:text-white transition-colors"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                isActive
                  ? 'bg-amber-500/10 text-amber-400 border-l-2 border-amber-500'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              } ${isCollapsed ? 'justify-center' : ''}`}
            >
              <span className={isActive ? 'text-amber-400' : 'text-gray-400 group-hover:text-white'}>
                {item.icon}
              </span>
              {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-800 p-3">
        <div className={`flex items-center gap-3 px-2 py-2 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <span className="text-amber-400 text-xs font-bold">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.name}</p>
              <p className="text-gray-500 text-xs capitalize">{user?.role}</p>
            </div>
          )}
        </div>
        <button
          onClick={logout}
          className={`flex items-center gap-2 mt-2 px-3 py-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all w-full ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          <LogOut className="w-4 h-4" />
          {!isCollapsed && <span className="text-sm">Sair</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-[#1E1E2D] rounded-lg flex items-center justify-center text-white shadow-lg"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`lg:hidden fixed top-0 left-0 h-full w-64 bg-[#1E1E2D] z-40 flex flex-col transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex fixed top-0 left-0 h-full bg-[#1E1E2D] z-30 flex-col transition-all duration-300 ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};

export default Sidebar;
