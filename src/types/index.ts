export type Role = 'owner' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
  businessId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BusinessSettings {
  id: string;
  ownerUid: string;
  name: string;
  tagline: string;
  currency: string;
  timezone: string;
  defaultMinStock: number;
  phone?: string;
  address?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  ownerUid: string;
  businessId: string;
  name: string;
  sku: string;
  category: string; // e.g. "Woody / Amber", "Floral / Fresh", "Gourmand"
  bottleSizeMl: number; // e.g. 30, 50, 100
  costPrice: number; // Modal per unit (Rp)
  sellingPrice: number; // Harga jual per unit (Rp)
  initialStock: number;
  currentStock: number;
  minStockAlert: number;
  notes?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type CapitalType = 'initial' | 'additional';

export interface CapitalTransaction {
  id: string;
  ownerUid: string;
  businessId: string;
  type: CapitalType;
  amount: number;
  date: string; // YYYY-MM-DD
  source: string; // e.g. "Tabungan Pribadi", "Investor", "Transfer Rekening Mandiri"
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type PaymentMethod = 'tunai' | 'transfer' | 'qris' | 'ewallet' | 'lainnya';
export type PaymentStatus = 'lunas' | 'belum_lunas' | 'sebagian';

export interface Sale {
  id: string;
  ownerUid: string;
  businessId: string;
  invoiceNumber: string;
  date: string; // YYYY-MM-DD
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  extraCost: number; // e.g. ongkir atau biaya admin ditanggung penjual
  totalAmount: number; // (quantity * unitPrice) - discount + extraCost
  amountPaid: number;
  remainingBalance: number;
  cogs: number; // Cost of goods sold: quantity * costPrice
  grossProfit: number; // (totalAmount - extraCost) - cogs
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  customerName?: string;
  notes?: string;
  isCancelled?: boolean;
  cancellationReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SalePayment {
  id: string;
  ownerUid: string;
  businessId: string;
  saleId: string;
  amount: number;
  date: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  notes?: string;
  createdAt?: string;
}

export type ExpenseCategory =
  | 'Pembelian stok parfum'
  | 'Botol dan packaging'
  | 'Label dan stiker'
  | 'Pengiriman'
  | 'Promosi dan iklan'
  | 'Operasional'
  | 'Transportasi'
  | 'Biaya platform atau administrasi'
  | 'Pengeluaran lain';

export interface Expense {
  id: string;
  ownerUid: string;
  businessId: string;
  category: ExpenseCategory | string;
  amount: number;
  date: string; // YYYY-MM-DD
  paymentMethod: string;
  paymentStatus: 'lunas' | 'belum_lunas';
  description: string;
  receiptRef?: string;
  isStockPurchase?: boolean;
  linkedProductId?: string;
  stockQuantityAdded?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface OtherIncome {
  id: string;
  ownerUid: string;
  businessId: string;
  category: string; // e.g. "Cashback Supplier", "Pengembalian Dana", "Pendapatan Non-Penjualan"
  amount: number;
  date: string; // YYYY-MM-DD
  source: string;
  notes?: string;
  createdAt?: string;
}

export type InventoryMovementType = 'in' | 'out' | 'adjustment' | 'return';

export interface InventoryMovement {
  id: string;
  ownerUid: string;
  businessId: string;
  productId: string;
  productName?: string;
  type: InventoryMovementType;
  quantityDelta: number; // + or -
  previousStock: number;
  newStock: number;
  costPerUnit?: number;
  reason: string;
  referenceId?: string; // saleId or expenseId
  date: string;
  createdAt?: string;
}

export interface CashflowSummary {
  totalCapital: number;
  totalSalesRevenue: number; // Total nominal penjualan
  totalCashReceived: number; // Uang riil yang sudah diterima dari penjualan + cicilan
  totalAccountsReceivable: number; // Piutang belum lunas
  totalOtherIncome: number;
  totalExpenses: number;
  operationalExpenses: number;
  stockPurchaseExpenses: number;
  realCashBalance: number; // (Total Modal + Total Kas Penjualan + Total Pemasukan Lain) - Total Pengeluaran
  inventoryValuation: number; // Total stok * harga modal
  totalCogs: number; // Total HPP barang terjual (non-cancelled)
  grossProfit: number; // Penjualan bersih - HPP
  netProfit: number; // Laba kotor - Pengeluaran operasional
}
