export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'coordinator' | 'member';
  team?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  _id: string;
  name: string;
  internalCode: string;
  category: string;
  description?: string;
  storageLocation?: string;
  quantity: number;
  minimumQuantity: number;
  variations: Variation[];
  createdBy?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Variation {
  name: string;
  quantity: number;
}

export interface Loan {
  _id: string;
  product: Product;
  variation?: string;
  team: string;
  personName: string;
  quantity: number;
  observation?: string;
  status: 'active' | 'returned' | 'partial';
  returnedQuantity: number;
  createdBy?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Return {
  _id: string;
  loan: Loan;
  quantity: number;
  returnedBy: string;
  returnTeam: string;
  notes?: string;
  createdBy?: User;
  createdAt: string;
}

export interface Occurrence {
  _id: string;
  type: 'manual' | 'automatic';
  product: Product;
  quantity: number;
  description: string;
  team: string;
  personName: string;
  loan?: string;
  status: 'pending' | 'acknowledged';
  acknowledgedBy?: User;
  acknowledgedAt?: string;
  createdBy?: User;
  createdAt: string;
  updatedAt: string;
}

export interface LogEntry {
  _id: string;
  user?: User;
  action: string;
  target?: string;
  details?: string;
  ip?: string;
  userAgent?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalProducts: number;
  loanedProducts: number;
  availableProducts: number;
  totalOccurrences: number;
  acknowledgedOccurrences: number;
  pendingOccurrences: number;
  activeLoans: number;
  todayReturns: number;
  lowStockProducts: number;
  outOfStockProducts: number;
}

export interface ChartData {
  stockByCategory: { _id: string; total: number; count: number }[];
  loanStatus: { _id: string; count: number }[];
  loansByDay: { _id: string; count: number }[];
  topLoanedProducts: { name: string; totalLoaned: number }[];
}

export interface Notification {
  _id: string;
  type: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

export const TEAMS = [
  'Acolhida',
  'Alegria',
  'Animacao',
  'Apoio',
  'Cafe',
  'Cozinha',
  'Dirigente',
  'Encerramento',
  'Garcom',
  'Geral',
  'Intercessao',
  'Liturgia',
  'Minibar',
  'Ordem',
  'Sala',
  'Secretaria',
  'Vigilia',
  'Visitacao',
  'Outros',
] as const;

export type Team = (typeof TEAMS)[number];
