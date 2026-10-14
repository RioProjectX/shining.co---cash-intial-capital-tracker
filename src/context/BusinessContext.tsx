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
  getDocs,
  getDoc,
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

    // Helper for error handling on snapshot
    const onSnapshotError = (collectionName: string) => (err: unknown) => {
      console.error(`Error in onSnapshot listener for ${collectionName}:`, err);
      setSyncStatus('error');
      setErrorMsg(`Sinkronisasi ${collectionName} gagal: ${err instanceof Error ? err.message : String(err)}`);
    };

    const updateSyncSuccess = () => {
      setSyncStatus('synced');
      setLastSyncTime(new Date());
    };

    // 1. Business settings
    const settingsDocRef = doc(db, 'businesses', uid);
    const unsubSettings = onSnapshot(
      settingsDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setBusinessSettings(docSnap.data() as BusinessSettings);
        } else {
          // Initialize default business document
          const initialSettings: BusinessSettings = {
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
          setDoc(settingsDocRef, initialSettings).catch(console.error);
          setBusinessSettings(initialSettings);
        }
        updateSyncSuccess();
      },
      onSnapshotError('businesses')
    );

    // 2. Products listener
    const productsQuery = query(collection(db, 'products'), where('ownerUid', '==', uid));
    const unsubProducts = onSnapshot(
      productsQuery,
      (snapshot) => {
        const list: Product[] = [];
        snapshot.forEach((d) => list.push({ ...d.data(), id: d.id } as Product));
        // Sort by name
        list.sort((a, b) => a.name.localeCompare(b.name));
        setProducts(list);
        updateSyncSuccess();
      },
      onSnapshotError('products')
    );

    // 3. Capital transactions listener
    const capitalQuery = query(collection(db, 'capitalTransactions'), where('ownerUid', '==', uid));
    const unsubCapital = onSnapshot(
      capitalQuery,
      (snapshot) => {
        const list: CapitalTransaction[] = [];
        snapshot.forEach((d) => list.push({ ...d.data(), id: d.id } as CapitalTransaction));
        list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setCapitalTransactions(list);
        updateSyncSuccess();
      },
      onSnapshotError('capitalTransactions')
    );

    // 4. Sales listener
    const salesQuery = query(collection(db, 'sales'), where('ownerUid', '==', uid));
    const unsubSales = onSnapshot(
      salesQuery,
      (snapshot) => {
        const list: Sale[] = [];
        snapshot.forEach((d) => list.push({ ...d.data(), id: d.id } as Sale));
        list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setSales(list);
        updateSyncSuccess();
      },
      onSnapshotError('sales')
    );

    // 5. Sale Payments listener
    const salePaymentsQuery = query(collection(db, 'salePayments'), where('ownerUid', '==', uid));
    const unsubSalePayments = onSnapshot(
      salePaymentsQuery,
      (snapshot) => {
        const list: SalePayment[] = [];
        snapshot.forEach((d) => list.push({ ...d.data(), id: d.id } as SalePayment));
        list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setSalePayments(list);
        updateSyncSuccess();
      },
      onSnapshotError('salePayments')
    );

    // 6. Expenses listener
    const expensesQuery = query(collection(db, 'expenses'), where('ownerUid', '==', uid));
    const unsubExpenses = onSnapshot(
      expensesQuery,
      (snapshot) => {
        const list: Expense[] = [];
        snapshot.forEach((d) => list.push({ ...d.data(), id: d.id } as Expense));
        list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setExpenses(list);
        updateSyncSuccess();
      },
      onSnapshotError('expenses')
    );

    // 7. Other income listener
    const incomeQuery = query(collection(db, 'otherIncome'), where('ownerUid', '==', uid));
    const unsubIncome = onSnapshot(
      incomeQuery,
      (snapshot) => {
        const list: OtherIncome[] = [];
        snapshot.forEach((d) => list.push({ ...d.data(), id: d.id } as OtherIncome));
        list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setOtherIncomes(list);
        updateSyncSuccess();
      },
      onSnapshotError('otherIncome')
    );

    // 8. Inventory Movements listener
    const movementsQuery = query(collection(db, 'inventoryMovements'), where('ownerUid', '==', uid));
    const unsubMovements = onSnapshot(
      movementsQuery,
      (snapshot) => {
        const list: InventoryMovement[] = [];
        snapshot.forEach((d) => list.push({ ...d.data(), id: d.id } as InventoryMovement));
        list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setInventoryMovements(list);
        updateSyncSuccess();
        setLoading(false);
      },
      onSnapshotError('inventoryMovements')
    );

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
    // Saldo kas = modal yang disetor + kas diterima dari penjualan + pemasukan lainnya - seluruh pengeluaran kas
    const realCashBalance = (totalCapital + totalCashReceived + totalOtherIncome) - totalExpenses;

    // 7. Net Profit = Gross Profit - Operational Expenses
    // (Note: Stock purchases are already represented through inventory & COGS when sold to prevent double deduction)
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
    const newId = doc(collection(db, 'products')).id;
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

    try {
      const batch = writeBatch(db);
      const productRef = doc(db, 'products', newId);
      batch.set(productRef, productPayload);

      // If initial stock > 0, log audit movement
      if (data.initialStock > 0) {
        const movementId = doc(collection(db, 'inventoryMovements')).id;
        const movementRef = doc(db, 'inventoryMovements', movementId);
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
        batch.set(movementRef, movementData);
      }

      await batch.commit();
      setSyncStatus('synced');
      return newId;
    } catch (err) {
      setSyncStatus('error');
      handleFirestoreError(err, OperationType.WRITE, 'products');
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    if (!currentUser) throw new Error('Pengguna belum login');
    setSyncStatus('saving');
    try {
      const productRef = doc(db, 'products', id);
      await updateDoc(productRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
      setSyncStatus('synced');
    } catch (err) {
      setSyncStatus('error');
      handleFirestoreError(err, OperationType.UPDATE, `products/${id}`);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!currentUser) throw new Error('Pengguna belum login');
    setSyncStatus('saving');
    try {
      // Soft-delete by setting active: false or deleting if no sales exist
      const productRef = doc(db, 'products', id);
      await deleteDoc(productRef);
      setSyncStatus('synced');
    } catch (err) {
      setSyncStatus('error');
      handleFirestoreError(err, OperationType.DELETE, `products/${id}`);
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

    try {
      await runTransaction(db, async (transaction) => {
        const productRef = doc(db, 'products', productId);
        const prodDoc = await transaction.get(productRef);
        if (!prodDoc.exists()) {
          throw new Error('Produk tidak ditemukan');
        }

        const prodData = prodDoc.data() as Product;
        const currentStock = prodData.currentStock || 0;
        const newStock = currentStock + quantityToAdd;

        // Optionally update weighted cost price
        const totalOldCost = currentStock * (prodData.costPrice || 0);
        const totalNewAddedCost = (quantityToAdd * costPerUnit) + extraCost;
        const newCostPrice = newStock > 0 ? Math.round((totalOldCost + totalNewAddedCost) / newStock) : costPerUnit;

        // 1. Update product
        transaction.update(productRef, {
          currentStock: newStock,
          costPrice: newCostPrice > 0 ? newCostPrice : prodData.costPrice,
          updatedAt: now,
        });

        // 2. Inventory Movement Log
        const movementId = doc(collection(db, 'inventoryMovements')).id;
        const movementRef = doc(db, 'inventoryMovements', movementId);
        const movementData: InventoryMovement = {
          id: movementId,
          ownerUid: currentUser.uid,
          businessId: currentUser.uid,
          productId,
          productName: prodData.name,
          type: 'in',
          quantityDelta: quantityToAdd,
          previousStock: currentStock,
          newStock,
          costPerUnit,
          reason: notes || `Restock +${quantityToAdd} botol`,
          date,
          createdAt: now,
        };
        transaction.set(movementRef, movementData);

        // 3. Create linked Expense record if requested
        if (createExpenseRecord) {
          const expenseId = doc(collection(db, 'expenses')).id;
          const expenseRef = doc(db, 'expenses', expenseId);
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
            description: `Pembelian stok: ${prodData.name} (${quantityToAdd} botol @ Rp${costPerUnit.toLocaleString('id-ID')})`,
            isStockPurchase: true,
            linkedProductId: productId,
            stockQuantityAdded: quantityToAdd,
            createdAt: now,
            updatedAt: now,
          };
          transaction.set(expenseRef, expenseData);
        }
      });
      setSyncStatus('synced');
    } catch (err) {
      setSyncStatus('error');
      handleFirestoreError(err, OperationType.WRITE, `products/${productId}`);
    }
  };

  const adjustStock = async (productId: string, newStock: number, reason: string) => {
    if (!currentUser) throw new Error('Pengguna belum login');
    if (!reason.trim()) throw new Error('Alasan penyesuaian stok wajib diisi');
    setSyncStatus('saving');
    const now = new Date().toISOString();

    try {
      await runTransaction(db, async (transaction) => {
        const productRef = doc(db, 'products', productId);
        const prodDoc = await transaction.get(productRef);
        if (!prodDoc.exists()) throw new Error('Produk tidak ditemukan');

        const prodData = prodDoc.data() as Product;
        const currentStock = prodData.currentStock || 0;
        const delta = newStock - currentStock;

        transaction.update(productRef, {
          currentStock: newStock,
          updatedAt: now,
        });

        const movementId = doc(collection(db, 'inventoryMovements')).id;
        const movementRef = doc(db, 'inventoryMovements', movementId);
        const movementData: InventoryMovement = {
          id: movementId,
          ownerUid: currentUser.uid,
          businessId: currentUser.uid,
          productId,
          productName: prodData.name,
          type: 'adjustment',
          quantityDelta: delta,
          previousStock: currentStock,
          newStock,
          costPerUnit: prodData.costPrice,
          reason: `Koreksi stok: ${reason}`,
          date: now.split('T')[0],
          createdAt: now,
        };
        transaction.set(movementRef, movementData);
      });
      setSyncStatus('synced');
    } catch (err) {
      setSyncStatus('error');
      handleFirestoreError(err, OperationType.WRITE, `products/${productId}`);
    }
  };

  // Capital Actions
  const addCapital = async (data: Omit<CapitalTransaction, 'id' | 'ownerUid' | 'businessId'>): Promise<string> => {
    if (!currentUser) throw new Error('Pengguna belum login');
    setSyncStatus('saving');
    const id = doc(collection(db, 'capitalTransactions')).id;
    const now = new Date().toISOString();
    const payload: CapitalTransaction = {
      ...data,
      id,
      ownerUid: currentUser.uid,
      businessId: currentUser.uid,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await setDoc(doc(db, 'capitalTransactions', id), payload);
      setSyncStatus('synced');
      return id;
    } catch (err) {
      setSyncStatus('error');
      handleFirestoreError(err, OperationType.CREATE, 'capitalTransactions');
    }
  };

  const updateCapital = async (id: string, updates: Partial<CapitalTransaction>) => {
    if (!currentUser) throw new Error('Pengguna belum login');
    setSyncStatus('saving');
    try {
      await updateDoc(doc(db, 'capitalTransactions', id), {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
      setSyncStatus('synced');
    } catch (err) {
      setSyncStatus('error');
      handleFirestoreError(err, OperationType.UPDATE, `capitalTransactions/${id}`);
    }
  };

  const deleteCapital = async (id: string) => {
    if (!currentUser) throw new Error('Pengguna belum login');
    setSyncStatus('saving');
    try {
      await deleteDoc(doc(db, 'capitalTransactions', id));
      setSyncStatus('synced');
    } catch (err) {
      setSyncStatus('error');
      handleFirestoreError(err, OperationType.DELETE, `capitalTransactions/${id}`);
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
    const saleId = doc(collection(db, 'sales')).id;
    const invoiceNumber = `SHN-${Date.now().toString().slice(-6)}`;

    try {
      await runTransaction(db, async (transaction) => {
        const productRef = doc(db, 'products', saleData.productId);
        const prodDoc = await transaction.get(productRef);
        if (!prodDoc.exists()) throw new Error('Produk tidak ditemukan');

        const prodData = prodDoc.data() as Product;
        const currentStock = prodData.currentStock || 0;

        if (currentStock < saleData.quantity) {
          throw new Error(
            `Stok tidak mencukupi. Stok tersedia: ${currentStock} botol, diminta: ${saleData.quantity} botol.`
          );
        }

        const newStock = currentStock - saleData.quantity;
        const cogs = saleData.quantity * (prodData.costPrice || 0);
        const totalAmount = (saleData.quantity * saleData.unitPrice) - saleData.discount + saleData.extraCost;

        // Determine paid amount & remaining balance
        let actualPaid = saleData.amountPaid;
        if (saleData.paymentStatus === 'lunas') {
          actualPaid = totalAmount;
        } else if (saleData.paymentStatus === 'belum_lunas') {
          actualPaid = 0;
        }
        const remainingBalance = Math.max(0, totalAmount - actualPaid);
        const grossProfit = (totalAmount - saleData.extraCost) - cogs;

        // 1. Decrement product stock
        transaction.update(productRef, {
          currentStock: newStock,
          updatedAt: now,
        });

        // 2. Create Sale document
        const saleRef = doc(db, 'sales', saleId);
        const salePayload: Sale = {
          id: saleId,
          ownerUid: currentUser.uid,
          businessId: currentUser.uid,
          invoiceNumber,
          date: saleData.date,
          productId: saleData.productId,
          productName: prodData.name,
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
        transaction.set(saleRef, salePayload);

        // 3. Log Inventory Movement
        const movementId = doc(collection(db, 'inventoryMovements')).id;
        const movementRef = doc(db, 'inventoryMovements', movementId);
        const movementData: InventoryMovement = {
          id: movementId,
          ownerUid: currentUser.uid,
          businessId: currentUser.uid,
          productId: saleData.productId,
          productName: prodData.name,
          type: 'out',
          quantityDelta: -saleData.quantity,
          previousStock: currentStock,
          newStock,
          costPerUnit: prodData.costPrice,
          reason: `Penjualan #${invoiceNumber} (${saleData.customerName || 'Pelanggan'})`,
          referenceId: saleId,
          date: saleData.date,
          createdAt: now,
        };
        transaction.set(movementRef, movementData);
      });

      setSyncStatus('synced');
      return saleId;
    } catch (err) {
      setSyncStatus('error');
      handleFirestoreError(err, OperationType.WRITE, 'sales');
    }
  };

  const cancelSale = async (saleId: string, reason: string) => {
    if (!currentUser) throw new Error('Pengguna belum login');
    if (!reason.trim()) throw new Error('Alasan pembatalan transaksi wajib diisi');
    setSyncStatus('saving');
    const now = new Date().toISOString();

    try {
      await runTransaction(db, async (transaction) => {
        const saleRef = doc(db, 'sales', saleId);
        const saleDoc = await transaction.get(saleRef);
        if (!saleDoc.exists()) throw new Error('Transaksi penjualan tidak ditemukan');

        const saleData = saleDoc.data() as Sale;
        if (saleData.isCancelled) throw new Error('Transaksi ini sudah dibatalkan sebelumnya');

        const productRef = doc(db, 'products', saleData.productId);
        const prodDoc = await transaction.get(productRef);

        let previousStock = 0;
        let newStock = 0;

        if (prodDoc.exists()) {
          const prodData = prodDoc.data() as Product;
          previousStock = prodData.currentStock || 0;
          newStock = previousStock + saleData.quantity;

          // 1. Revert product stock
          transaction.update(productRef, {
            currentStock: newStock,
            updatedAt: now,
          });
        }

        // 2. Mark sale as cancelled
        transaction.update(saleRef, {
          isCancelled: true,
          cancellationReason: reason,
          updatedAt: now,
        });

        // 3. Log return movement
        const movementId = doc(collection(db, 'inventoryMovements')).id;
        const movementRef = doc(db, 'inventoryMovements', movementId);
        const movementData: InventoryMovement = {
          id: movementId,
          ownerUid: currentUser.uid,
          businessId: currentUser.uid,
          productId: saleData.productId,
          productName: saleData.productName,
          type: 'return',
          quantityDelta: saleData.quantity,
          previousStock,
          newStock,
          costPerUnit: saleData.cogs / saleData.quantity,
          reason: `Retur / Batal Penjualan #${saleData.invoiceNumber}: ${reason}`,
          referenceId: saleId,
          date: now.split('T')[0],
          createdAt: now,
        };
        transaction.set(movementRef, movementData);
      });

      setSyncStatus('synced');
    } catch (err) {
      setSyncStatus('error');
      handleFirestoreError(err, OperationType.WRITE, `sales/${saleId}`);
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

    try {
      await runTransaction(db, async (transaction) => {
        const saleRef = doc(db, 'sales', saleId);
        const saleDoc = await transaction.get(saleRef);
        if (!saleDoc.exists()) throw new Error('Transaksi penjualan tidak ditemukan');

        const saleData = saleDoc.data() as Sale;
        const currentPaid = saleData.amountPaid || 0;
        const totalAmount = saleData.totalAmount || 0;
        const newPaid = currentPaid + amount;
        const newRemaining = Math.max(0, totalAmount - newPaid);
        const newStatus: PaymentStatus = newRemaining === 0 ? 'lunas' : 'sebagian';

        // 1. Update sale record
        transaction.update(saleRef, {
          amountPaid: newPaid,
          remainingBalance: newRemaining,
          paymentStatus: newStatus,
          updatedAt: now,
        });

        // 2. Log payment record
        const paymentId = doc(collection(db, 'salePayments')).id;
        const paymentRef = doc(db, 'salePayments', paymentId);
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
        transaction.set(paymentRef, paymentData);
      });

      setSyncStatus('synced');
    } catch (err) {
      setSyncStatus('error');
      handleFirestoreError(err, OperationType.WRITE, `sales/${saleId}`);
    }
  };

  // Expense Actions
  const addExpense = async (data: Omit<Expense, 'id' | 'ownerUid' | 'businessId'>): Promise<string> => {
    if (!currentUser) throw new Error('Pengguna belum login');
    setSyncStatus('saving');
    const id = doc(collection(db, 'expenses')).id;
    const now = new Date().toISOString();
    const payload: Expense = {
      ...data,
      id,
      ownerUid: currentUser.uid,
      businessId: currentUser.uid,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await setDoc(doc(db, 'expenses', id), payload);
      setSyncStatus('synced');
      return id;
    } catch (err) {
      setSyncStatus('error');
      handleFirestoreError(err, OperationType.CREATE, 'expenses');
    }
  };

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    if (!currentUser) throw new Error('Pengguna belum login');
    setSyncStatus('saving');
    try {
      await updateDoc(doc(db, 'expenses', id), {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
      setSyncStatus('synced');
    } catch (err) {
      setSyncStatus('error');
      handleFirestoreError(err, OperationType.UPDATE, `expenses/${id}`);
    }
  };

  const deleteExpense = async (id: string) => {
    if (!currentUser) throw new Error('Pengguna belum login');
    setSyncStatus('saving');
    try {
      await deleteDoc(doc(db, 'expenses', id));
      setSyncStatus('synced');
    } catch (err) {
      setSyncStatus('error');
      handleFirestoreError(err, OperationType.DELETE, `expenses/${id}`);
    }
  };

  // Other Income Actions
  const addOtherIncome = async (data: Omit<OtherIncome, 'id' | 'ownerUid' | 'businessId'>): Promise<string> => {
    if (!currentUser) throw new Error('Pengguna belum login');
    setSyncStatus('saving');
    const id = doc(collection(db, 'otherIncome')).id;
    const now = new Date().toISOString();
    const payload: OtherIncome = {
      ...data,
      id,
      ownerUid: currentUser.uid,
      businessId: currentUser.uid,
      createdAt: now,
    };

    try {
      await setDoc(doc(db, 'otherIncome', id), payload);
      setSyncStatus('synced');
      return id;
    } catch (err) {
      setSyncStatus('error');
      handleFirestoreError(err, OperationType.CREATE, 'otherIncome');
    }
  };

  const deleteOtherIncome = async (id: string) => {
    if (!currentUser) throw new Error('Pengguna belum login');
    setSyncStatus('saving');
    try {
      await deleteDoc(doc(db, 'otherIncome', id));
      setSyncStatus('synced');
    } catch (err) {
      setSyncStatus('error');
      handleFirestoreError(err, OperationType.DELETE, `otherIncome/${id}`);
    }
  };

  // Business Settings Action
  const updateSettings = async (settings: Partial<BusinessSettings>) => {
    if (!currentUser) throw new Error('Pengguna belum login');
    setSyncStatus('saving');
    try {
      await updateDoc(doc(db, 'businesses', currentUser.uid), {
        ...settings,
        updatedAt: new Date().toISOString(),
      });
      setSyncStatus('synced');
    } catch (err) {
      setSyncStatus('error');
      handleFirestoreError(err, OperationType.UPDATE, `businesses/${currentUser.uid}`);
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
