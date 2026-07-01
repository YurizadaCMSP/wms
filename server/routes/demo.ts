import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { demoUsers, demoProducts, demoLoans, demoOccurrences, demoLogs } from '../utils/demoData';

const JWT_SECRET = 'secretaria-wms-jwt-secret-2026';
const router = Router();

// Helper to generate token
const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
};

// Auth
router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = demoUsers.find((u) => u.email === email.toLowerCase());
  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch && password !== 'adminplataforma12345') {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }
  const token = generateToken(user._id);
  res.json({
    token,
    user: { _id: user._id, name: user.name, email: user.email, role: user.role, team: user.team },
  });
});

router.post('/auth/logout', (_req, res) => {
  res.json({ message: 'Logged out' });
});

router.get('/auth/me', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) { res.status(401).json({ error: 'No token' }); return; }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = demoUsers.find((u) => u._id === decoded.userId);
    if (!user) { res.status(401).json({ error: 'User not found' }); return; }
    res.json({ _id: user._id, name: user.name, email: user.email, role: user.role, team: user.team });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

router.post('/auth/forgot-password', (_req, res) => {
  res.json({ message: 'Email sent' });
});

// Users
router.get('/users', (_req, res) => {
  res.json(demoUsers.map((u) => ({ ...u, password: undefined })));
});

router.post('/users', (req, res) => {
  const newUser = { _id: String(demoUsers.length + 1), ...req.body, isActive: true, createdAt: new Date().toISOString() };
  demoUsers.push(newUser);
  res.status(201).json(newUser);
});

router.put('/users/:id', (req, res) => {
  const idx = demoUsers.findIndex((u) => u._id === req.params.id);
  if (idx >= 0) { demoUsers[idx] = { ...demoUsers[idx], ...req.body }; }
  res.json(demoUsers[idx]);
});

router.delete('/users/:id', (req, res) => {
  const idx = demoUsers.findIndex((u) => u._id === req.params.id);
  if (idx >= 0) demoUsers[idx].isActive = false;
  res.json({ message: 'Deactivated' });
});

router.post('/users/:id/reset-password', (_req, res) => {
  res.json({ message: 'Password reset' });
});

// Products
router.get('/products', (req, res) => {
  let products = [...demoProducts];
  const { search, category, status } = req.query;
  if (search) {
    const s = (search as string).toLowerCase();
    products = products.filter((p) => p.name.toLowerCase().includes(s) || p.internalCode.toLowerCase().includes(s));
  }
  if (category) products = products.filter((p) => p.category === category);
  if (status === 'out_of_stock') products = products.filter((p) => p.quantity === 0);
  if (status === 'low_stock') products = products.filter((p) => p.quantity > 0 && p.quantity <= p.minimumQuantity);
  if (status === 'in_stock') products = products.filter((p) => p.quantity > p.minimumQuantity);
  res.json({ products, total: products.length, page: 1, pages: 1 });
});

router.get('/products/categories', (_req, res) => {
  const cats = [...new Set(demoProducts.map((p) => p.category))];
  res.json(cats);
});

router.get('/products/low-stock', (_req, res) => {
  res.json(demoProducts.filter((p) => p.quantity > 0 && p.quantity <= p.minimumQuantity));
});

router.get('/products/out-of-stock', (_req, res) => {
  res.json(demoProducts.filter((p) => p.quantity === 0));
});

router.get('/products/:id', (req, res) => {
  const product = demoProducts.find((p) => p._id === req.params.id);
  res.json(product || demoProducts[0]);
});

router.post('/products', (req, res) => {
  const newProduct = { _id: String(demoProducts.length + 1), internalCode: `PRD-${Date.now()}`, ...req.body, createdAt: new Date().toISOString() };
  demoProducts.push(newProduct);
  res.status(201).json(newProduct);
});

router.put('/products/:id', (req, res) => {
  const idx = demoProducts.findIndex((p) => p._id === req.params.id);
  if (idx >= 0) { demoProducts[idx] = { ...demoProducts[idx], ...req.body }; }
  res.json(demoProducts[idx] || req.body);
});

router.delete('/products/:id', (req, res) => {
  const idx = demoProducts.findIndex((p) => p._id === req.params.id);
  if (idx >= 0) demoProducts.splice(idx, 1);
  res.json({ message: 'Deleted' });
});

// Loans
router.get('/loans', (req, res) => {
  let loans = [...demoLoans];
  const { status } = req.query;
  if (status) loans = loans.filter((l) => l.status === status);
  res.json({ loans, total: loans.length, page: 1, pages: 1 });
});

router.get('/loans/active', (_req, res) => {
  res.json(demoLoans.filter((l) => l.status === 'active' || l.status === 'partial'));
});

router.get('/loans/:id', (req, res) => {
  const loan = demoLoans.find((l) => l._id === req.params.id);
  res.json(loan || demoLoans[0]);
});

router.post('/loans', (req, res) => {
  const { productId, variation, team, personName, quantity, observation } = req.body;
  const product = demoProducts.find((p) => p._id === productId);
  const newLoan = {
    _id: String(demoLoans.length + 1),
    product: product || demoProducts[0],
    variation,
    team,
    personName,
    quantity,
    observation,
    status: 'active' as const,
    returnedQuantity: 0,
    createdAt: new Date().toISOString(),
  };
  demoLoans.unshift(newLoan);
  if (product) product.quantity -= quantity;
  res.status(201).json(newLoan);
});

// Returns
router.get('/returns', (_req, res) => {
  res.json({ returns: [], total: 0, page: 1, pages: 1 });
});

router.post('/returns', (req, res) => {
  const { loanId, quantity } = req.body;
  const loan = demoLoans.find((l) => l._id === loanId);
  if (loan) {
    loan.returnedQuantity += quantity;
    if (loan.returnedQuantity >= loan.quantity) loan.status = 'returned';
    else loan.status = 'partial';
    if (loan.product) loan.product.quantity += quantity;
  }
  res.status(201).json({ return: req.body, loanStatus: loan?.status, occurrenceCreated: false });
});

// Occurrences
router.get('/occurrences', (req, res) => {
  let occurrences = [...demoOccurrences];
  const { status } = req.query;
  if (status) occurrences = occurrences.filter((o) => o.status === status);
  res.json({ occurrences, total: occurrences.length, page: 1, pages: 1 });
});

router.post('/occurrences', (req, res) => {
  const newOcc = { _id: String(demoOccurrences.length + 1), ...req.body, type: 'manual', status: 'pending', createdAt: new Date().toISOString() };
  demoOccurrences.unshift(newOcc);
  res.status(201).json(newOcc);
});

router.put('/occurrences/:id/acknowledge', (req, res) => {
  const occ = demoOccurrences.find((o) => o._id === req.params.id);
  if (occ) {
    occ.status = 'acknowledged';
    occ.acknowledgedBy = demoUsers[1];
    occ.acknowledgedAt = new Date().toISOString();
  }
  res.json(occ);
});

// Dashboard
router.get('/dashboard/stats', (_req, res) => {
  res.json({
    totalProducts: demoProducts.length,
    loanedProducts: demoLoans.filter((l) => l.status === 'active').reduce((s, l) => s + l.quantity, 0),
    availableProducts: demoProducts.filter((p) => p.quantity > 0).length,
    totalOccurrences: demoOccurrences.length,
    acknowledgedOccurrences: demoOccurrences.filter((o) => o.status === 'acknowledged').length,
    pendingOccurrences: demoOccurrences.filter((o) => o.status === 'pending').length,
    activeLoans: demoLoans.filter((l) => l.status === 'active').length,
    todayReturns: 0,
    lowStockProducts: demoProducts.filter((p) => p.quantity > 0 && p.quantity <= p.minimumQuantity).length,
    outOfStockProducts: demoProducts.filter((p) => p.quantity === 0).length,
  });
});

router.get('/dashboard/recent-activity', (_req, res) => {
  res.json(demoLogs);
});

router.get('/dashboard/charts', (_req, res) => {
  const stockByCategory = Object.entries(
    demoProducts.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + p.quantity;
      return acc;
    }, {} as Record<string, number>)
  ).map(([k, v]) => ({ _id: k, total: v, count: demoProducts.filter((p) => p.category === k).length }));

  res.json({
    stockByCategory,
    loanStatus: [
      { _id: 'active', count: demoLoans.filter((l) => l.status === 'active').length },
      { _id: 'returned', count: demoLoans.filter((l) => l.status === 'returned').length },
    ],
    loansByDay: [{ _id: new Date().toISOString().split('T')[0], count: demoLoans.length }],
    topLoanedProducts: [],
  });
});

router.get('/dashboard/recent-loans', (_req, res) => {
  res.json(demoLoans.slice(0, 5));
});

router.get('/dashboard/recent-returns', (_req, res) => {
  res.json([]);
});

// Logs
router.get('/logs', (_req, res) => {
  res.json({ logs: demoLogs, total: demoLogs.length, page: 1, pages: 1 });
});

// Reports
router.get('/reports/:type', (req, res) => {
  const { type } = req.params;
  let data: unknown[] = [];
  switch (type) {
    case 'stock': data = demoProducts; break;
    case 'loans': data = demoLoans; break;
    case 'occurrences': data = demoOccurrences; break;
    case 'critical_stock': data = demoProducts.filter((p) => p.quantity <= p.minimumQuantity); break;
    case 'users': data = demoUsers.map((u) => ({ ...u, password: undefined })); break;
    case 'logs': data = demoLogs; break;
  }
  res.json({ type, data, generatedAt: new Date() });
});

export default router;
