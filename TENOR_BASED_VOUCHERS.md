# TENOR-BASED COUPON GENERATION

## Overview
Updated voucher system to generate coupons dynamically based on each customer's individual tenor instead of a fixed number.

## Key Changes

### 1. Dynamic Coupon Count
- **Previous**: Fixed 100 coupons regardless of customer tenor
- **New**: Generate exactly as many coupons as the customer's tenor
- **Logic**: Each customer gets coupons from current installment to their tenor limit

### 2. Calculation Rules

#### Single Customer
```typescript
if (contracts.length === 1) {
  totalCoupons = customer.tenor_days; // Exact match
}
```

#### Multiple Customers
```typescript
if (contracts.length > 1) {
  totalCoupons = Math.max(...contracts.map(c => c.tenor_days));
  // But each customer only gets coupons up to their individual tenor
}
```

### 3. Generation Logic
```typescript
// For each contract
for (let i = currentInstallment + 1; i <= contractTenor; i++) {
  // Generate voucher for installment i
  // Stop at customer's individual tenor limit
}
```

## Examples

### Example 1: Single Customer
- Customer A: 100-day tenor → 100 coupons
- Customer B: 150-day tenor → 150 coupons
- Customer C: 60-day tenor → 60 coupons

### Example 2: Multiple Customers
- Customer A: 100-day tenor → 100 coupons
- Customer B: 150-day tenor → 150 coupons  
- Customer C: 60-day tenor → 60 coupons
- **Total pages**: Based on longest tenor (150), but each customer only gets their tenor amount

### Example 3: Partial Progress
- Customer with 100-day tenor, currently on installment 80
- **Result**: 20 remaining coupons (from 81 to 100)

## Benefits

1. **Accurate Business Logic**: Customers get exactly the coupons they need
2. **Resource Efficiency**: No wastage of paper or unused coupons  
3. **Flexible Printing**: Works with any tenor length automatically
4. **Progress Tracking**: Only generates remaining installments

## Technical Implementation

### VoucherPageProps Interface
```typescript
interface VoucherPageProps {
  contracts: ContractData[];
  couponsPerPage?: number;
  totalCoupons?: number; // Now optional - calculated if not provided
}
```

### Calculation Function
```typescript
const calculateTotalCoupons = (): number => {
  if (totalCoupons !== undefined) return totalCoupons; // Manual override
  if (contracts.length === 1) return contracts[0].tenor_days;
  return Math.max(...contracts.map(c => c.tenor_days)); // Max tenor for multiple
};
```

### Generation Logic
```typescript
sortedContracts.forEach(contract => {
  const contractTenor = contract.tenor_days || 100;
  const currentInstallment = contract.current_installment_index || 0;
  
  for (let i = currentInstallment + 1; i <= contractTenor; i++) {
    // Generate voucher for installment i
  }
});
```

## Backward Compatibility

- **Manual Override**: Can still specify `totalCoupons` manually if needed
- **Default Fallback**: Uses 100 if no contracts provided
- **Existing Code**: All existing calls continue to work

## Use Cases

1. **Individual Printing**: Perfect for single customer coupon books
2. **Bulk Printing**: Each customer gets their exact need
3. **Progress-based**: Only prints remaining coupons
4. **Custom Tenors**: Automatically adapts to any tenor length

Date: December 27, 2025