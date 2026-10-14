import { calculateCashflowAndProfit } from './accounting';
import { Product, Sale, Expense, CapitalTransaction, OtherIncome } from '../types';

/**
 * Self-running assertions test suite to verify math consistency
 */
export function runAccountingSanityCheck(): { passed: boolean; message: string } {
  // Mock data setup
  const mockProducts: Product[] = [
    {
      id: 'p1',
      ownerUid: 'user1',
      businessId: 'biz1',
      name: 'Santal Noir',
      sku: 'SHN-001',
      category: 'Woody',
      bottleSizeMl: 50,
      costPrice: 50000,
      sellingPrice: 150000,
      initialStock: 20,
      currentStock: 18,
      minStockAlert: 5,
      active: true,
    },
  ];

  const mockCapital: CapitalTransaction[] = [
    {
      id: 'c1',
      ownerUid: 'user1',
      businessId: 'biz1',
      type: 'initial',
      amount: 5000000,
      date: '2026-10-01',
      source: 'Modal Pendiri',
    },
  ];

  const mockSales: Sale[] = [
    {
      id: 's1',
      ownerUid: 'user1',
      businessId: 'biz1',
      invoiceNumber: 'SHN-000001',
      date: '2026-10-02',
      productId: 'p1',
      productName: 'Santal Noir',
      quantity: 2,
      unitPrice: 150000,
      discount: 0,
      extraCost: 0,
      totalAmount: 300000,
      amountPaid: 200000,
      remainingBalance: 100000,
      cogs: 100000, // 2 * 50,000
      grossProfit: 200000, // 300,000 - 100,000
      paymentMethod: 'transfer',
      paymentStatus: 'sebagian',
    },
  ];

  const mockExpenses: Expense[] = [
    {
      id: 'e1',
      ownerUid: 'user1',
      businessId: 'biz1',
      category: 'Botol dan packaging',
      amount: 400000,
      date: '2026-10-03',
      paymentMethod: 'transfer',
      paymentStatus: 'lunas',
      description: 'Box dan silinder',
    },
  ];

  const mockOtherIncome: OtherIncome[] = [
    {
      id: 'o1',
      ownerUid: 'user1',
      businessId: 'biz1',
      category: 'Cashback Supplier',
      amount: 50000,
      date: '2026-10-04',
      source: 'Cashback',
    },
  ];

  const result = calculateCashflowAndProfit({
    products: mockProducts,
    capitalTransactions: mockCapital,
    sales: mockSales,
    expenses: mockExpenses,
    otherIncomes: mockOtherIncome,
  });

  // Verify assertions:
  // 1. Total Capital = 5,000,000
  if (result.totalCapital !== 5000000) return { passed: false, message: 'Total Capital assertion failed' };

  // 2. Total Sales = 300,000
  if (result.totalSalesRevenue !== 300000) return { passed: false, message: 'Sales Revenue assertion failed' };

  // 3. Realized Cash from Sales = 200,000
  if (result.totalCashReceived !== 200000) return { passed: false, message: 'Cash Received assertion failed' };

  // 4. Accounts Receivable = 100,000
  if (result.totalAccountsReceivable !== 100000) return { passed: false, message: 'Accounts Receivable assertion failed' };

  // 5. Total Expenses = 400,000
  if (result.totalExpenses !== 400000) return { passed: false, message: 'Total Expenses assertion failed' };

  // 6. Real Cash Balance = (5,000,000 + 200,000 + 50,000) - 400,000 = 4,850,000
  if (result.realCashBalance !== 4850000) return { passed: false, message: 'Real Cash Balance assertion failed' };

  // 7. Inventory Valuation = 18 * 50,000 = 900,000
  if (result.inventoryValuation !== 900000) return { passed: false, message: 'Inventory Valuation assertion failed' };

  // 8. Gross Profit = 300,000 - 100,000 = 200,000
  if (result.grossProfit !== 200000) return { passed: false, message: 'Gross Profit assertion failed' };

  // 9. Net Profit = 200,000 - 400,000 = -200,000
  if (result.netProfit !== -200000) return { passed: false, message: 'Net Profit assertion failed' };

  return { passed: true, message: 'All accounting assertions passed successfully.' };
}
