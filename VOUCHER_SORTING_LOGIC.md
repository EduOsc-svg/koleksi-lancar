# VOUCHER SORTING AND BACKGROUND LOGIC

## Overview
Updated voucher system to implement customer-code based sorting and tenor-based background coloring logic.

## Key Changes

### 1. Customer Code Sorting
- **Previous**: Vouchers were generated in the order contracts were received
- **New**: Contracts are sorted alphabetically/numerically by customer code before voucher generation
- **Implementation**: `sortedContracts = [...contracts].sort()` with `localeCompare()`
- **Benefit**: When printing multiple customers together, vouchers are grouped by customer code

### 2. Background Color Logic
- **Previous**: Last 10 vouchers (by sequence) used red background
- **New**: Vouchers with remaining tenor ≤ 10 days use red background
- **Logic**: `remainingTenorDays = tenor - (installmentNumber - 1)`
- **Background Rules**:
  - Red: `remainingTenorDays <= 10`
  - Black: `remainingTenorDays > 10`

## Technical Implementation

### VoucherData Interface
```typescript
interface VoucherData {
  // ... existing fields
  remainingTenorDays?: number; // NEW: Remaining days in tenor
}
```

### Sorting Logic
```typescript
const sortedContracts = [...contracts].sort((a, b) => {
  const codeA = a.customers?.customer_code || "ZZZ";
  const codeB = b.customers?.customer_code || "ZZZ";
  return codeA.localeCompare(codeB, undefined, { numeric: true });
});
```

### Background Logic
```typescript
const isUrgentTenor = data.remainingTenorDays !== undefined && 
                     data.remainingTenorDays <= 10;
const voucherClass = isUrgentTenor ? "voucher-urgent" : "voucher-normal";
```

## Benefits

1. **Organized Printing**: Customer vouchers are grouped together when printing multiple customers
2. **Accurate Urgency**: Background color now reflects actual business urgency (near end of tenor)
3. **Scalable Logic**: Works regardless of total voucher count or customer mix
4. **Visual Clarity**: Red vouchers indicate contracts nearing completion

## CSS Classes

- `.voucher-normal`: Black background for vouchers with >10 days remaining
- `.voucher-urgent`: Red background for vouchers with ≤10 days remaining

## Usage Example

When printing 100 vouchers from customers with codes: A001, B002, C003
- All A001 vouchers will appear first
- Then all B002 vouchers
- Then all C003 vouchers
- Each voucher shows red background if remaining tenor ≤ 10 days

Date: December 27, 2025