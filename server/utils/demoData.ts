import mongoose from 'mongoose';

// Demo data for when MongoDB is not available
export const demoUsers = [
  { _id: '1', name: 'Administrador', email: 'adminplataforma', password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiAYMyzJ/I2K', role: 'admin', isActive: true, createdAt: new Date().toISOString() },
  { _id: '2', name: 'Joao Coordenador', email: 'joao@ejc.com', password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiAYMyzJ/I2K', role: 'coordinator', team: 'Secretaria', isActive: true, createdAt: new Date().toISOString() },
  { _id: '3', name: 'Maria Integrante', email: 'maria@ejc.com', password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiAYMyzJ/I2K', role: 'member', team: 'Acolhida', isActive: true, createdAt: new Date().toISOString() },
];

export const demoProducts = [
  { _id: '1', name: 'Caneta Bic', internalCode: 'PRD-A1B2C3D4', category: 'Papelaria', description: 'Caneta esferografica', storageLocation: 'Armario A', quantity: 50, minimumQuantity: 10, variations: [{ name: 'Azul', quantity: 20 }, { name: 'Preta', quantity: 15 }, { name: 'Vermelha', quantity: 15 }], createdAt: new Date().toISOString() },
  { _id: '2', name: 'Folha A4', internalCode: 'PRD-E5F6G7H8', category: 'Papelaria', description: 'Pacote 500 folhas', storageLocation: 'Armario B', quantity: 20, minimumQuantity: 5, variations: [], createdAt: new Date().toISOString() },
  { _id: '3', name: 'Tesoura', internalCode: 'PRD-I9J0K1L2', category: 'Material', description: 'Tesoura escolar', storageLocation: 'Armario A', quantity: 15, minimumQuantity: 3, variations: [], createdAt: new Date().toISOString() },
  { _id: '4', name: 'Cola Bastao', internalCode: 'PRD-M3N4O5P6', category: 'Material', description: 'Cola em bastao 40g', storageLocation: 'Armario C', quantity: 0, minimumQuantity: 5, variations: [], createdAt: new Date().toISOString() },
  { _id: '5', name: 'Lapis HB', internalCode: 'PRD-Q7R8S9T0', category: 'Papelaria', description: 'Lapis grafite HB', storageLocation: 'Armario A', quantity: 8, minimumQuantity: 10, variations: [], createdAt: new Date().toISOString() },
];

export const demoLoans = [
  { _id: '1', product: demoProducts[0], variation: 'Azul', team: 'Acolhida', personName: 'Pedro Silva', quantity: 5, observation: 'Para decoracao', status: 'active', returnedQuantity: 0, createdAt: new Date(Date.now() - 86400000).toISOString() },
  { _id: '2', product: demoProducts[1], variation: '', team: 'Secretaria', personName: 'Ana Paula', quantity: 2, observation: '', status: 'active', returnedQuantity: 0, createdAt: new Date(Date.now() - 172800000).toISOString() },
  { _id: '3', product: demoProducts[2], variation: '', team: 'Cozinha', personName: 'Carlos Mendes', quantity: 3, observation: '', status: 'returned', returnedQuantity: 3, createdAt: new Date(Date.now() - 259200000).toISOString() },
];

export const demoOccurrences = [
  { _id: '1', type: 'automatic', product: demoProducts[0], quantity: 2, description: 'Quantidade em falta apos devolucao parcial', team: 'Acolhida', personName: 'Pedro Silva', status: 'pending', createdAt: new Date(Date.now() - 86400000).toISOString() },
  { _id: '2', type: 'manual', product: demoProducts[3], quantity: 5, description: 'Material danificado durante transporte', team: 'Apoio', personName: 'Lucas Oliveira', status: 'acknowledged', acknowledgedBy: demoUsers[1], acknowledgedAt: new Date().toISOString(), createdAt: new Date(Date.now() - 172800000).toISOString() },
];

export const demoLogs = [
  { _id: '1', user: demoUsers[0], action: 'LOGIN', target: 'Auth', details: 'User admin logged in', ip: '192.168.1.1', createdAt: new Date().toISOString() },
  { _id: '2', user: demoUsers[1], action: 'CREATE_PRODUCT', target: 'Product', details: 'Created Caneta Bic', ip: '192.168.1.2', createdAt: new Date(Date.now() - 3600000).toISOString() },
  { _id: '3', user: demoUsers[2], action: 'CREATE_LOAN', target: 'Loan', details: 'Loaned 5x Caneta Bic', ip: '192.168.1.3', createdAt: new Date(Date.now() - 86400000).toISOString() },
];

let isDemoMode = false;

export const setDemoMode = (value: boolean): void => {
  isDemoMode = value;
};

export const getIsDemoMode = (): boolean => isDemoMode;
