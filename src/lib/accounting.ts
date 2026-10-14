import { Product, Sale, Expense, CapitalTransaction, OtherIncome, CashflowSummary } from '../types';

/**
 * Pure accounting calculation engine for shining.co
 * Ensures mathematical consistency across all reports, cards, and audit checks.
 */
export function calculateCashflowAndProfit(params: {
  products: Product[];
  capitalTransactions: CapitalTransaction[];
  sales: Sale[];
  expenses: Expense[];
  otherIncomes: OtherIncome[];
}): CashflowSummary {
  const { products, capitalTransactions, sales, expenses, otherIncomes } = params;

  // 1. Total Modal
  const totalCapital = capitalTransactions.reduce((acc, c) => acc + (c.amount || 0), 0);

  // 2. Penjualan & Kas Penjualan
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

  // 3. Pemasukan Lainnya
  const totalOtherIncome = otherIncomes.reduce((acc, o) => acc + (o.amount || 0), 0);

  // 4. Pengeluaran
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

  // 5. Nilai Persediaan
  const inventoryValuation = products.reduce((acc, p) => {
    const qty = Math.max(0, p.currentStock || 0);
    return acc + qty * (p.costPrice || 0);
  }, 0);

  // 6. Saldo Kas Riil
  const realCashBalance = (totalCapital + totalCashReceived + totalOtherIncome) - totalExpenses;

  // 7. Laba Bersih
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
}
