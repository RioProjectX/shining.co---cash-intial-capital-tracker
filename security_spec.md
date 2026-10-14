# Security Specification - shining.co Business Tracker

## 1. Data Invariants
- Every business document (products, sales, expenses, capitalTransactions, otherIncome, inventoryMovements, salePayments) belongs to a designated `ownerUid`.
- Users can only read and write data where `ownerUid == request.auth.uid`.
- Sensitive operations require authentication (`request.auth != null`).
- Immutable fields (`id`, `ownerUid`, `businessId`, `createdAt`) cannot be altered on update.
- Monetary values and stock numbers must be numeric and non-negative (unless adjustments explicitly specify delta direction).
- Document keys must adhere to strict schemas with zero unauthorized "ghost" properties.
- Status changes for sales and payments must follow permitted state transitions.
- Inventory movements must require a valid reason string.

## 2. The Dirty Dozen Payloads (Targeting Vulnerabilities)
1. **Unauthenticated Write**: An unauthenticated request attempts to create a product.
   - Result: PERMISSION_DENIED.
2. **Owner Spoofing on Product**: Authenticated user 'alice' attempts to create a product with `ownerUid: 'bob'`.
   - Result: PERMISSION_DENIED.
3. **Cross-Tenant List Scraping**: Authenticated user 'alice' attempts to list all documents in `/sales` without scoping `ownerUid == 'alice'`.
   - Result: PERMISSION_DENIED.
4. **Cross-Tenant Document Read**: User 'alice' attempts to read `/expenses/{bobExpenseId}` belonging to 'bob'.
   - Result: PERMISSION_DENIED.
5. **Shadow Field Injection**: User attempts to update a sale with an unauthorized shadow field `_isAdmin: true`.
   - Result: PERMISSION_DENIED.
6. **Immutable Field Tampering**: User attempts to update a capital record changing `ownerUid` or `createdAt`.
   - Result: PERMISSION_DENIED.
7. **Negative Amount Exploit**: User attempts to inject a negative capital amount `{ amount: -5000000 }`.
   - Result: PERMISSION_DENIED.
8. **Oversized String Bomb / Resource Exhaustion**: User sends a product name of length 10,000 characters.
   - Result: PERMISSION_DENIED.
9. **Invalid Document ID Poisoning**: Malicious string with slashes, control chars or length > 128 as docId.
   - Result: PERMISSION_DENIED.
10. **State Skipping on Cancelled Sale**: Tampering with an already cancelled sale document to reactivate it without proper reversal.
   - Result: PERMISSION_DENIED.
11. **User Role Self-Escalation**: User attempts to update their own profile `/users/{uid}` to assign `role: 'superadmin'`.
   - Result: PERMISSION_DENIED.
12. **Orphaned Inventory Movement**: Creating an inventory movement without required product reference, stock delta, or reason.
   - Result: PERMISSION_DENIED.
