import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  runTransaction,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from './AuthContext';
import {
  Product,
  CapitalTransaction,
  Sale,
  SalePayment,
  Expense,
  OtherIncome,
  InventoryMovement,
  BusinessSettings,
  CashflowSummary,
  PaymentMethod,
  PaymentStatus,
} from '../types';

export type SyncStatus = 'synced' | 'saving' | 'offline' | 'error';

interface BusinessContextType {
  products: Product[];
  capitalTransactions: CapitalTransaction[];
  sales: Sale[];
  salePayments: SalePayment[];
  expenses: Expense[];
  otherIncomes: OtherIncome[];
  inventoryMovements: InventoryMovement[];
  businessSettings: BusinessSettings | null;
  summary: CashflowSummary;
  syncStatus: SyncStatus;
  lastSyncTime: Date | null;
  loading: boolean;
  errorMsg: string | null;

  // Actions
  addProduct: (product: Omit<Product, 'id' | 'ownerUid' | 'businessId'>) => Promise<string>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  restockProduct: (
    productId: string,
    quantityToAdd: number,
    costPerUnit: number,
    extraCost: number,
    date: string,
    notes: string,
    createExpenseRecord: boolean
  ) => Promise<void>;
  adjustStock: (productId: string, newStock: number, reason: string) => Promise<void>;

  addCapital: (data: Omit<CapitalTransaction, 'id' | 'ownerUid' | 'businessId'>) => Promise<string>;
  updateCapital: (id: string, updates: Partial<CapitalTransaction>) => Promise<void>;
  deleteCapital: (id: string) => Promise<void>;

  recordSale: (saleData: {
    productId: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    extraCost: number;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    amountPaid: number;
    customerName?: string;
    notes?: string;
    date: string;
  }) => Promise<string>;
  cancelSale: (saleId: string, reason: string) => Promise<void>;
  recordSalePayment: (
    saleId: string,
    amount: number,
    paymentMethod: PaymentMethod,
    date: string,
    notes?: string
  ) => Promise<void>;

  addExpense: (expenseData: Omit<Expense, 'id' | 'ownerUid' | 'businessId'>) => Promise<string>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  addOtherIncome: (incomeData: Omit<OtherIncome, 'id' | 'ownerUid' | 'businessId'>) => Promise<string>;
  deleteOtherIncome: (id: string) => Promise<void>;

  updateSettings: (settings: Partial<BusinessSettings>) => Promise<void>;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export const BusinessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isOffline } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [capitalTransactions, setCapitalTransactions] = useState<CapitalTransaction[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [salePayments, setSalePayments] = useState<SalePayment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [otherIncomes, setOtherIncomes] = useState<OtherIncome[]>([]);
  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>([]);
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null);

  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Helper to persist in localStorage
  const saveLocal = (key: string, data: any) => {
    try {
      localStorage.setItem(`shining_${key}`, JSON.stringify(data));
    } catch {}
  };

  // Helper to load fallback initial data
  const loadFallbackData = (uid: string) => {
    try {
      const p = localStorage.getItem('shining_products');
      if (p) {
        setProducts(JSON.parse(p));
      } else {
        const defaultProds: Product[] = [
          {
            id: 'prod-santal-noir',
            ownerUid: uid,
            businessId: uid,
            name: 'Santal Noir',
            sku: 'SHN-SN-50',
            category: 'Woody / Spicy',
            bottleSizeMl: 50,
            costPrice: 65000,
            sellingPrice: 185000,
            initialStock: 25,
            currentStock: 25,
            minStockAlert: 5,
            notes: 'Australian Sandalwood, Cardamom, Papyrus, Cedarwood, Leather',
            active: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'prod-velvet-bergamot',
            ownerUid: uid,
            businessId: uid,
            name: 'Velvet Bergamot',
            sku: 'SHN-VB-50',
            category: 'Citrus / Fresh',
            bottleSizeMl: 50,
            costPrice: 60000,
            sellingPrice: 175000,
            initialStock: 20,
            currentStock: 20,
            minStockAlert: 5,
            notes: 'Calabrian Bergamot, Neroli, Vetiver, White Amber',
            active: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'prod-amber-rose',
            ownerUid: uid,
            businessId: uid,
            name: 'Amber Rose',
            sku: 'SHN-AR-50',
            category: 'Floral / Amber',
            bottleSizeMl: 50,
            costPrice: 70000,
            sellingPrice: 195000,
            initialStock: 15,
            currentStock: 15,
            minStockAlert: 5,
            notes: 'Damascena Rose, Ambergris, Clove, Saffron, Dark Musk',
            active: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'prod-oud-blanc',
            ownerUid: uid,
            businessId: uid,
            name: 'Oud Blanc',
            sku: 'SHN-OB-50',
            category: 'Woody / Gourmand',
            bottleSizeMl: 50,
            costPrice: 85000,
            sellingPrice: 235000,
            initialStock: 10,
            currentStock: 8,
            minStockAlert: 5,
            notes: 'White Agarwood, Bourbon Vanilla, Incense, Patchouli',
            active: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];
        setProducts(defaultProds);
        saveLocal('products', defaultProds);
      }

      const c = localStorage.getItem('shining_capital');
      if (c) {
        setCapitalTransactions(JSON.parse(c));
      } else {
        const defaultCap: CapitalTransaction[] = [
          {
            id: 'cap-initial-1',
            ownerUid: uid,
            businessId: uid,
            type: 'initial',
            amount: 15000000,
            date: new Date().toISOString().split('T')[0],
            source: 'Modal Pendiri (RioProjectX)',
            notes: 'Alokasi pengadaan bibit parfum konsentrat, botol kaca spray, dan kemasan silinder',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];
        setCapitalTransactions(defaultCap);
        saveLocal('capital', defaultCap);
      }

      const s = localStorage.getItem('shining_sales');
      if (s) setSales(JSON.parse(s));

      const sp = localStorage.getItem('shining_salepayments');
      if (sp) setSalePayments(JSON.parse(sp));

      const exp = localStorage.getItem('shining_expenses');
      if (exp) setExpenses(JSON.parse(exp));

      const inc = localStorage.getItem('shining_otherincome');
      if (inc) setOtherIncomes(JSON.parse(inc));

      const mov = localStorage.getItem('shining_movements');
      if (mov) setInventoryMovements(JSON.parse(mov));

      const bs = localStorage.getItem('shining_settings');
      if (bs) {
        setBusinessSettings(JSON.parse(bs));
      } else {
        const defaultBiz: BusinessSettings = {
          id: uid,
          ownerUid: uid,
          name: 'shining.co',
          tagline: 'shine with just one spray',
          currency: 'IDR',
          timezone: 'Asia/Jakarta',
          defaultMinStock: 5,
          phone: '',
          address: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setBusinessSettings(defaultBiz);
        saveLocal('settings', defaultBiz);
      }
    } catch (err) {
      console.warn('Fallback local storage:', err);
    }
  };

  // Sync status reflecting network
  useEffect(() => {
    if (isOffline) {
      setSyncStatus('offline');
    } else if (syncStatus === 'offline') {
      setSyncStatus('synced');
    }
  }, [isOffline]);

  // Set up Real-time onSnapshot Listeners when authenticated
  useEffect(() => {
    if (!currentUser) {
      setProducts([]);
      setCapitalTransactions([]);
      setSales([]);
      setSalePayments([]);
      setExpenses([]);
      setOtherIncomes([]);
      setInventoryMovements([]);
      setBusinessSettings(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const uid = currentUser.uid;

    // Load local storage first so UI renders immediately
    loadFallbackData(uid);

    // Helper for error handling on snapshot
    const onSnapshotError = (collectionName: string) => (err: unknown) => {
      console.warn(`Firestore onSnapshot warning for ${collectionName}:`, err);
      setLoading(false);
      setSyncStatus('offline');
    };

    const updateSyncSuccess = () => {
      setSyncStatus('synced');
      setLastSyncTime(new Date());
      setLoading(false);
    };

    let unsubSettings = () => {};
    let unsubProducts = () => {};
    let unsubCapital = () => {};
    let unsubSales = () => {};
    let unsubSalePayments = () => {};
    let unsubExpenses = () => {};
    let unsubIncome = () => {};
    let unsubMovements = () => {};

    try {
      // 1. Business settings
      const settingsDocRef = doc(db, 'businesses', uid);
      unsubSettings = onSnapshot(
        settingsDocRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as BusinessSettings;
            setBusinessSettings(data);
            saveLocal('settings', data);
          }
          updateSyncSuccess();
        },
        onSnapshotError('businesses')
      );

      // 2. Products listener
      const productsQuery = query(collection(db, 'products'), where('ownerUid', '==', uid));
      unsubProducts = onSnapshot(
        productsQuery,
        (snapshot) => {
          if (!snapshot.empty) {
            const list: Product[] = [];
            snapshot.forEach((d) => list.push({ ...d.data(), id: d.id } as Product));
            list.sort((a, b) => a.name.localeCompare(b.name));
            setProducts(list);
            saveLocal('products', list);
          }
          updateSyncSuccess();
        },
        onSnapshotError('products')
      );

      // 3. Capital transactions listener
      const capitalQuery = query(collection(db, 'capitalTransactions'), where('ownerUid', '==', uid));
      unsubCapital = onSnapshot(
        capitalQuery,
        (snapshot) => {
          if (!snapshot.empty) {
            const list: CapitalTransaction[] = [];
            snapshot.forEach((d) => list.push({ ...d.data(), id: d.id } as CapitalTransaction));
            list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setCapitalTransactions(list);
            saveLocal('capital', list);
          }
          updateSyncSuccess();
        },
        onSnapshotError('capitalTransactions')
      );

      // 4. Sales listener
      const salesQuery = query(collection(db, 'sales'), where('ownerUid', '==', uid));
      unsubSales = onSnapshot(
        salesQuery,
        (snapshot) => {
          if (!snapshot.empty) {
            const list: Sale[] = [];
            snapshot.forEach((d) => list.push({ ...d.data(), id: d.id } as Sale));
            list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setSales(list);
            saveLocal('sales', list);
          }
          updateSyncSuccess();
        },
        onSnapshotError('sales')
      );

      // 5. Sale Payments listener
      const salePaymentsQuery = query(collection(db, 'salePayments'), where('ownerUid', '==', uid));
      unsubSalePayments = onSnapshot(
        salePaymentsQuery,
        (snapshot) => {
          if (!snapshot.empty) {
            const list: SalePayment[] = [];
            snapshot.forEach((d) => list.push({ ...d.data(), id: d.id } as SalePayment));
            list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setSalePayments(list);
            saveLocal('salepayments', list);
          }
          updateSyncSuccess();
        },
        onSnapshotError('salePayments')
      );

      // 6. Expenses listener
      const expensesQuery = query(collection(db, 'expenses'), where('ownerUid', '==', uid));
      unsubExpenses = onSnapshot(
        expensesQuery,
        (snapshot) => {
          if (!snapshot.empty) {
            const list: Expense[] = [];
            snapshot.forEach((d) => list.push({ ...d.data(), id: d.id } as Expense));
            list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setExpenses(list);
            saveLocal('expenses', list);
          }
          updateSyncSuccess();
        },
        onSnapshotError('expenses')
      );

      // 7. Other income listener
      const incomeQuery = query(collection(db, 'otherIncome'), where('ownerUid', '==', uid));
      unsubIncome = onSnapshot(
        incomeQuery,
        (snapshot) => {
          if (!snapshot.empty) {
            const list: OtherIncome[] = [];
            snapshot.forEach((d) => list.push({ ...d.data(), id: d.id } as OtherIncome));
            list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setOtherIncomes(list);
            saveLocal('otherincome', list);
          }
          updateSyncSuccess();
        },
        onSnapshotError('otherIncome')
      );

      // 8. Inventory Movements listener
      const movementsQuery = query(collection(db, 'inventoryMovements'), where('ownerUid', '==', uid));
      unsubMovements = onSnapshot(
        movementsQuery,
        (snapshot) => {
          if (!snapshot.empty) {
            const list: InventoryMovement[] = [];
            snapshot.forEach((d) => list.push({ ...d.data(), id: d.id } as InventoryMovement));
            list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setInventoryMovements(list);
            saveLocal('movements', list);
          }
          updateSyncSuccess();
        },
        onSnapshotError('inventoryMovements')
      );
    } catch (e) {
      console.warn('Listeners initialization error:', e);
      setLoading(false);
      setSyncStatus('offline');
    }

    return () => {
      unsubSettings();
      unsubProducts();
      unsubCapital();
      unsubSales();
      unsubSalePayments();
      unsubExpenses();
      unsubIncome();
      unsubMovements();
    };
  }, [currentUser]);

  // Compute Cashflow, Accounting, and Inventory Metrics
  const summary = useMemo<CashflowSummary>(() => {
    // 1. Total Capital
    const totalCapital = capitalTransactions.reduce((acc, item) => acc + (item.amount || 0), 0);

    // 2. Sales and Realized Cash
    let totalSalesRevenue = 0;
    let totalCashReceived = 0;
    let totalAccountsReceivable = 0;
    let totalCogs = 0;
    let grossProfit = 0;

    sales.forEach((s) => {
      if (!s.isCancelled) {
        totalSalesRevenue += s.totalAmount || 0;
        totalCashReceived += s.amountPaid || 0;
        if (s.paymentStatus !== 'lunas') {
          totalAccountsReceivable += s.remainingBalance || 0;
        }
        totalCogs += s.cogs || 0;
        grossProfit += s.grossProfit || 0;
      }
    });

    // 3. Other Incomes
    const totalOtherIncome = otherIncomes.reduce((acc, item) => acc + (item.amount || 0), 0);

    // 4. Expenses
    let totalExpenses = 0;
    let stockPurchaseExpenses = 0;
    let operationalExpenses = 0;

    expenses.forEach((e) => {
      const amt = e.amount || 0;
      totalExpenses += amt;
      if (e.isStockPurchase || e.category === 'Pembelian stok parfum') {
        stockPurchaseExpenses += amt;
      } else {
        operationalExpenses += amt;
      }
    });

    // 5. Inventory Valuation
    const inventoryValuation = products.reduce((acc, p) => {
      const stock = Math.max(0, p.currentStock || 0);
      return acc + stock * (p.costPrice || 0);
    }, 0);

    // 6. Real Cash Balance (Strict Cashflow Formula)
    const realCashBalance = (totalCapital + totalCashReceived + totalOtherIncome) - totalExpenses;

    // 7. Net Profit = Gross Profit - Operational Expenses
    const netProfit = grossProfit - operationalExpenses;

    return {
      totalCapital,
      totalSalesRevenue,
      totalCashReceived,
      totalAccountsReceivable,
      totalOtherIncome,
      totalExpenses,
      operationalExpenses,
      stockPurchaseExpenses,
      realCashBalance,
      inventoryValuation,
      totalCogs,
      grossProfit,
      netProfit,
    };
  }, [capitalTransactions, sales, otherIncomes, expenses, products]);

  // Product Actions
  const addProduct = async (data: Omit<Product, 'id' | 'ownerUid' | 'businessId'>): Promise<string> => {
    if (!currentUser) throw new Error('Pengguna belum login');
    setSyncStatus('saving');
    const newId = `prod-${Date.now()}`;
    const now = new Date().toISOString();

    const productPayload: Product = {
      ...data,
      id: newId,
      ownerUid: currentUser.uid,
      businessId: currentUser.uid,
      active: true,
      createdAt: now,
      updatedAt: now,
    };

    // Update local state immediately
    const updated = [productPayload, ...products];
    setProducts(updated);
    saveLocal('products', updated);

    // If initial stock > 0, log audit movement locally
    if (data.initialStock > 0) {
      const movementId = `mov-${Date.now()}`;
      const movementData: InventoryMovement = {
        id: movementId,
        ownerUid: currentUser.uid,
        businessId: currentUser.uid,
        productId: newId,
        productName: data.name,
        type: 'in',
        quantityDelta: data.initialStock,
        previousStock: 0,
        newStock: data.initialStock,
        costPerUnit: data.costPrice,
        reason: 'Stok awal produk baru',
        date: now.split('T')[0],
        createdAt: now,
      };
      const movUpdated = [movementData, ...inventoryMovements];
      setInventoryMovements(movUpdated);
      saveLocal('movements', movUpdated);
    }

    try {
      const batch = writeBatch(db);
      const productRef = doc(db, 'products', newId);
      batch.set(productRef, productPayload);
      await batch.commit();
      setSyncStatus('synced');
    } catch (err) {
      console.warn('Firestore write warning:', err);
      setSyncStatus('offline');
    }
    return newId;
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    if (!currentUser) throw new Error('Pengguna belum login');
    setSyncStatus('saving');
    const updated = products.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p));
    setProducts(updated);
    saveLocal('products', updated);

    try {
      const productRef = doc(db, 'products', id);
      await updateDoc(productRef, { ...updates, updatedAt: new Date().toISOString() });
      setSyncStatus('synced');
    } catch (err) {
      setSyncStatus('offline');
    }
  };

  const deleteProduct = async (id: string) => {
    if (!currentUser) throw new Error('Pengguna belum login');
    setSyncStatus('saving');
    const updated = products.filter((p) => p.id !== id);
    setProducts(updated);
    saveLocal('products', updated);

    try {
      const productRef = doc(db, 'products', id);
      await deleteDoc(productRef);
      setSyncStatus('synced');
    } catch (err) {
      setSyncStatus('offline');
    }
  };

  const restockProduct = async (
    productId: string,
    quantityToAdd: number,
    costPerUnit: number,
    extraCost: number,
    date: string,
    notes: string,
    createExpenseRecord: boolean
  ) => {
    if (!currentUser) throw new Error('Pengguna belum login');
    setSyncStatus('saving');
    const now = new Date().toISOString();

    const target = products.find((p) => p.id === productId);
    if (!target) throw new Error('Produk tidak ditemukan');

    const currentStock = target.currentStock || 0;
    const newStock = currentStock + quantityToAdd;
    const totalOldCost = currentStock * (target.costPrice || 0);
    const totalNewAddedCost = (quantityToAdd * costPerUnit) + extraCost;
    const newCostPrice = newStock > 0 ? Math.round((totalOldCost + totalNewAddedCost) / newStock) : costPerUnit;

    // Update product locally
    const updatedProds = products.map((p) =>
      p.id === productId ? { ...p, currentStock: newStock, costPrice: newCostPrice, updatedAt: now } : p
    );
    setProducts(updatedProds);
    saveLocal('products', updatedProds);

    // Update movement locally
    const movementId = `mov-${Date.now()}`;
    const movementData: InventoryMovement = {
      id: movementId,
      ownerUid: currentUser.uid,
      businessId: currentUser.uid,
      productId,
      productName: target.name,
      type: 'in',
      quantityDelta: quantityToAdd,
      previousStock: currentStock,
      newStock,
      costPerUnit,
      reason: notes || `Restock +${quantityToAdd} botol`,
      date,
      createdAt: now,
    };
    const updatedMovs = [movementData, ...inventoryMovements];
    setInventoryMovements(updatedMovs);
    saveLocal('movements', updatedMovs);

    // Update expense locally if requested
    if (createExpenseRecord) {
      const expenseId = `exp-${Date.now()}`;
      const totalExpenseAmount = (quantityToAdd * costPerUnit) + extraCost;
      const expenseData: Expense = {
        id: expenseId,
        ownerUid: currentUser.uid,
        businessId: currentUser.uid,
        category: 'Pembelian stok parfum',
        amount: totalExpenseAmount,
        date,
        paymentMethod: 'transfer',
        paymentStatus: 'lunas',
        description: `Pembelian stok: ${target.name} (${quantityToAdd} botol @ Rp${costPerUnit.toLocaleString('id-ID')})`,
        isStockPurchase: true,
        linkedProductId: productId,
        stockQuantityAdded: quantityToAdd,
        createdAt: now,
        updatedAt: now,
      };
      const updatedExps = [expenseData, ...expenses];
      setExpenses(updatedExps);
      saveLocal('expenses', updatedExps);
    }

    // Attempt Firestore write
    try {
      await runTransaction(db, async (transaction) => {
        const productRef = doc(db, 'products', productId);
        transaction.update(productRef, {
          currentStock: newStock,
          costPrice: newCostPrice,
          updatedAt: now,
        });
        const mRef = doc(db, 'inventoryMovements', movementId);
        transaction.set(mRef, movementData);
      });
      setSyncStatus('synced');
    } catch (err) {
      setSyncStatus('offline');
    }
  };

  const adjustStock = async (productId: string, newStock: number, reason: string) => {
    if (!currentUser) throw new Error('Pengguna belum login');
    if (!reason.trim()) throw new Error('Alasan penyesuaian stok wajib diisi');
    setSyncStatus('saving');
    const now = new Date().toISOString();

    const target = products.find((p) => p.id === productId);
    if (!target) throw new Error('Produk tidak ditemukan');

    const currentStock = target.currentStock || 0;
    const delta = newStock - currentStock;

    // Update locally
    const updatedProds = products.map((p) =>
      p.id === productId ? { ...p, currentStock: newStock, updatedAt: now } : p
    );
    setProducts(updatedProds);
    saveLocal('products', updatedProds);

    const movementId = `mov-${Date.now()}`;
    const movementData: InventoryMovement = {
      id: movementId,
      ownerUid: currentUser.uid,
      businessId: currentUser.uid,
      productId,
      productName: target.name,
      type: 'adjustment',
      quantityDelta: delta,
      previousStock: currentStock,
      newStock,
      costPerUnit: target.costPrice,
      reason: `Koreksi stok: ${reason}`,
      date: now.split('T')[0],
      createdAt: now,
    };
    const updatedMovs = [movementData, ...inventoryMovements];
    setInventoryMovements(updatedMovs);
    saveLocal('movements', updatedMovs);

    try {
      const productRef = doc(db, 'products', productId);
      await updateDoc(productRef, { currentStock: newStock, updatedAt: now });
      const mRef = doc(db, 'inventoryMovements', movementId);
      await setDoc(mRef, movementData);
      setSyncStatus('synced');
    } catch (err) {
      setSyncStatus('offline');
    }
  };

  // Capital Actions
  const addCapital = async (data: Omit<CapitalTransaction, 'id' | 'ownerUid' | 'businessId'>): Promise<string> => {
    if (!currentUser) throw new Error('Pengguna belum login');
    setSyncStatus('saving');
    const id = `cap-${Date.now()}`;
    const now = new Date().toISOString();
    const payload: CapitalTransaction = {
      ...data,
      id,
      ownerUid: currentUser.uid,
      businessId: currentUser.uid,
      createdAt: now,
      updatedAt: now,
    };

    const updated = [payload, ...capitalTransactions];
    setCapitalTransactions(updated);
    saveLocal('capital', updated);

    try {
      await setDoc(doc(db, 'capitalTransactions', id), payload);
      setSyncStatus('synced');
    } catch (err) {
      setSyncStatus('offline');
    }
    return id;
  };

  const updateCapital = async (id: string, updates: Partial<CapitalTransaction>) => {
    if (!currentUser) throw new Error('Pengguna belum login');
    setSyncStatus('saving');
    const updated = capitalTransactions.map((c) => (c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c));
    setCapitalTransactions(updated);
    saveLocal('capital', updated);

    try {
      await updateDoc(doc(db, 'capitalTransactions', id), { ...updates, updatedAt: new Date().toISOString() });
      setSyncStatus('synced');
    } catch (err) {
      setSyncStatus('offline');
    }
  };

  const deleteCapital = async (id: string) => {
    if (!currentUser) throw new Error('Pengguna belum login');
    setSyncStatus('saving');
    const updated = capitalTransactions.filter((c) => c.id !== id);
    setCapitalTransactions(updated);
    saveLocal('capital', updated);

    try {
      await deleteDoc(doc(db, 'capitalTransactions', id));
      setSyncStatus('synced');
    } catch (err) {
      setSyncStatus('offline');
    }
  };

  // Sales Actions (Atomic Inventory Deduction + Sale Creation)
  const recordSale = async (saleData: {
    productId: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    extraCost: number;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    amountPaid: number;
    customerName?: string;
    notes?: string;
    date: string;
  }): Promise<string> => {
    if (!currentUser) throw new Error('Pengguna belum login');
    setSyncStatus('saving');
    const now = new Date().toISOString();
    const saleId = `sale-${Date.now()}`;
    const invoiceNumber = `SHN-${Date.now().toString().slice(-6)}`;

    const targetProduct = products.find((p) => p.id === saleData.productId);
    if (!targetProduct) throw new Error('Produk tidak ditemukan');

    const currentStock = targetProduct.currentStock || 0;
    if (currentStock < saleData.quantity) {
      throw new Error(`Stok tidak mencukupi. Tersedia: ${currentStock} botol.`);
    }

    const newStock = currentStock - saleData.quantity;
    const cogs = saleData.quantity * (targetProduct.costPrice || 0);
    const totalAmount = (saleData.quantity * saleData.unitPrice) - saleData.discount + saleData.extraCost;

    let actualPaid = saleData.amountPaid;
    if (saleData.paymentStatus === 'lunas') actualPaid = totalAmount;
    if (saleData.paymentStatus === 'belum_lunas') actualPaid = 0;
    const remainingBalance = Math.max(0, totalAmount - actualPaid);
    const grossProfit = (totalAmount - saleData.extraCost) - cogs;

    const salePayload: Sale = {
      id: saleId,
      ownerUid: currentUser.uid,
      businessId: currentUser.uid,
      invoiceNumber,
      date: saleData.date,
      productId: saleData.productId,
      productName: targetProduct.name,
      quantity: saleData.quantity,
      unitPrice: saleData.unitPrice,
      discount: saleData.discount,
      extraCost: saleData.extraCost,
      totalAmount,
      amountPaid: actualPaid,
      remainingBalance,
      cogs,
      grossProfit,
      paymentMethod: saleData.paymentMethod,
      paymentStatus: saleData.paymentStatus,
      customerName: saleData.customerName || '',
      notes: saleData.notes || '',
      isCancelled: false,
      createdAt: now,
      updatedAt: now,
    };

    // Update sales locally
    const updatedSales = [salePayload, ...sales];
    setSales(updatedSales);
    saveLocal('sales', updatedSales);

    // Update product stock locally
    const updatedProds = products.map((p) =>
      p.id === saleData.productId ? { ...p, currentStock: newStock, updatedAt: now } : p
    );
    setProducts(updatedProds);
    saveLocal('products', updatedProds);

    // Movement log
    const movementId = `mov-${Date.now()}`;
    const movementData: InventoryMovement = {
      id: movementId,
      ownerUid: currentUser.uid,
      businessId: currentUser.uid,
      productId: saleData.productId,
      productName: targetProduct.name,
      type: 'out',
      quantityDelta: -saleData.quantity,
      previousStock: currentStock,
      newStock,
      costPerUnit: targetProduct.costPrice,
      reason: `Penjualan #${invoiceNumber} (${saleData.customerName || 'Pelanggan'})`,
      referenceId: saleId,
      date: saleData.date,
      createdAt: now,
    };
    const updatedMovs = [movementData, ...inventoryMovements];
    setInventoryMovements(updatedMovs);
    saveLocal('movements', updatedMovs);

    // Try Firestore write
    try {
      await runTransaction(db, async (transaction) => {
        const productRef = doc(db, 'products', saleData.productId);
        transaction.update(productRef, { currentStock: newStock, updatedAt: now });
        const saleRef = doc(db, 'sales', saleId);
        transaction.set(saleRef, salePayload);
        const mRef = doc(db, 'inventoryMovements', movementId);
        transaction.set(mRef, movementData);
      });
      setSyncStatus('synced');
    } catch (err) {
      setSyncStatus('offline');
    }

    return saleId;
  };

  const cancelSale = async (saleId: string, reason: string) => {
    if (!currentUser) throw new Error('Pengguna belum login');
    setSyncStatus('saving');
    const now = new Date().toISOString();

    const targetSale = sales.find((s) => s.id === saleId);
    if (!targetSale) throw new Error('Transaksi penjualan tidak ditemukan');

    const updatedSales = sales.map((s) =>
      s.id === saleId ? { ...s, isCancelled: true, cancellationReason: reason, updatedAt: now } : s
    );
    setSales(updatedSales);
    saveLocal('sales', updatedSales);

    // Revert product stock locally
    const targetProd = products.find((p) => p.id === targetSale.productId);
    if (targetProd) {
      const restoredStock = targetProd.currentStock + targetSale.quantity;
      const updatedProds = products.map((p) =>
        p.id === targetSale.productId ? { ...p, currentStock: restoredStock, updatedAt: now } : p
      );
      setProducts(updatedProds);
      saveLocal('products', updatedProds);
    }

    try {
      const saleRef = doc(db, 'sales', saleId);
      await updateDoc(saleRef, { isCancelled: true, cancellationReason: reason, updatedAt: now });
      setSyncStatus('synced');
    } catch (err) {
      setSyncStatus('offline');
    }
  };

  const recordSalePayment = async (
    saleId: string,
    amount: number,
    paymentMethod: PaymentMethod,
    date: string,
    notes?: string
  ) => {
    if (!currentUser) throw new Error('Pengguna belum login');
    setSyncStatus('saving');
    const now = new Date().toISOString();

    const targetSale = sales.find((s) => s.id === saleId);
    if (!targetSale) throw new Error('Transaksi penjualan tidak ditemukan');

    const newPaid = (targetSale.amountPaid || 0) + amount;
    const newRemaining = Math.max(0, targetSale.totalAmount - newPaid);
    const newStatus: PaymentStatus = newRemaining === 0 ? 'lunas' : 'sebagian';

    const updatedSales = sales.map((s) =>
      s.id === saleId ? { ...s, amountPaid: newPaid, remainingBalance: newRemaining, paymentStatus: newStatus, updatedAt: now } : s
    );
    setSales(updatedSales);
    saveLocal('sales', updatedSales);

    const paymentId = `pay-${Date.now()}`;
    const paymentData: SalePayment = {
      id: paymentId,
      ownerUid: currentUser.uid,
      businessId: currentUser.uid,
      saleId,
      amount,
      date,
      paymentMethod,
      notes: notes || '',
      createdAt: now,
    };
    const updatedPays = [paymentData, ...salePayments];
    setSalePayments(updatedPays);
    saveLocal('salepayments', updatedPays);

    try {
      const saleRef = doc(db, 'sales', saleId);
      await updateDoc(saleRef, { amountPaid: newPaid, remainingBalance: newRemaining, paymentStatus: newStatus, updatedAt: now });
      await setDoc(doc(db, 'salePayments', paymentId), paymentData);
      setSyncStatus('synced');
    } catch (err) {
      setSyncStatus('offline');
    }
  };

  // Expense Actions
  const addExpense = async (data: Omit<Expense, 'id' | 'ownerUid' | 'businessId'>): Promise<string> => {
    if (!currentUser) throw new Error('Pengguna belum login');
    setSyncStatus('saving');
    const id = `exp-${Date.now()}`;
    const now = new Date().toISOString();
    const payload: Expense = {
      ...data,
      id,
      ownerUid: currentUser.uid,
      businessId: currentUser.uid,
      createdAt: now,
      updatedAt: now,
    };

    const updated = [payload, ...expenses];
    setExpenses(updated);
    saveLocal('expenses', updated);

    try {
      await setDoc(doc(db, 'expenses', id), payload);
      setSyncStatus('synced');
    } catch (err) {
      setSyncStatus('offline');
    }
    return id;
  };

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    if (!currentUser) throw new Error('Pengguna belum login');
    setSyncStatus('saving');
    const updated = expenses.map((e) => (e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e));
    setExpenses(updated);
    saveLocal('expenses', updated);

    try {
      await updateDoc(doc(db, 'expenses', id), { ...updates, updatedAt: new Date().toISOString() });
      setSyncStatus('synced');
    } catch (err) {
      setSyncStatus('offline');
    }
  };

  const deleteExpense = async (id: string) => {
    if (!currentUser) throw new Error('Pengguna belum login');
    setSyncStatus('saving');
    const updated = expenses.filter((e) => e.id !== id);
    setExpenses(updated);
    saveLocal('expenses', updated);

    try {
      await deleteDoc(doc(db, 'expenses', id));
      setSyncStatus('synced');
    } catch (err) {
      setSyncStatus('offline');
    }
  };

  // Other Income Actions
  const addOtherIncome = async (data: Omit<OtherIncome, 'id' | 'ownerUid' | 'businessId'>): Promise<string> => {
    if (!currentUser) throw new Error('Pengguna belum login');
    setSyncStatus('saving');
    const id = `inc-${Date.now()}`;
    const now = new Date().toISOString();
    const payload: OtherIncome = {
      ...data,
      id,
      ownerUid: currentUser.uid,
      businessId: currentUser.uid,
      createdAt: now,
    };

    const updated = [payload, ...otherIncomes];
    setOtherIncomes(updated);
    saveLocal('otherincome', updated);

    try {
      await setDoc(doc(db, 'otherIncome', id), payload);
      setSyncStatus('synced');
    } catch (err) {
      setSyncStatus('offline');
    }
    return id;
  };

  const deleteOtherIncome = async (id: string) => {
    if (!currentUser) throw new Error('Pengguna belum login');
    setSyncStatus('saving');
    const updated = otherIncomes.filter((i) => i.id !== id);
    setOtherIncomes(updated);
    saveLocal('otherincome', updated);

    try {
      await deleteDoc(doc(db, 'otherIncome', id));
      setSyncStatus('synced');
    } catch (err) {
      setSyncStatus('offline');
    }
  };

  // Business Settings Action
  const updateSettings = async (settings: Partial<BusinessSettings>) => {
    if (!currentUser) throw new Error('Pengguna belum login');
    setSyncStatus('saving');
    if (businessSettings) {
      const updated = { ...businessSettings, ...settings, updatedAt: new Date().toISOString() };
      setBusinessSettings(updated);
      saveLocal('settings', updated);
    }

    try {
      await updateDoc(doc(db, 'businesses', currentUser.uid), {
        ...settings,
        updatedAt: new Date().toISOString(),
      });
      setSyncStatus('synced');
    } catch (err) {
      setSyncStatus('offline');
    }
  };

  return (
    <BusinessContext.Provider
      value={{
        products,
        capitalTransactions,
        sales,
        salePayments,
        expenses,
        otherIncomes,
        inventoryMovements,
        businessSettings,
        summary,
        syncStatus,
        lastSyncTime,
        loading,
        errorMsg,
        addProduct,
        updateProduct,
        deleteProduct,
        restockProduct,
        adjustStock,
        addCapital,
        updateCapital,
        deleteCapital,
        recordSale,
        cancelSale,
        recordSalePayment,
        addExpense,
        updateExpense,
        deleteExpense,
        addOtherIncome,
        deleteOtherIncome,
        updateSettings,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
};
