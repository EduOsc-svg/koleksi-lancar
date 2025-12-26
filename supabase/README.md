# Database Sample Data Scripts

This directory contains SQL scripts for managing sample data in the Koleksi Lancar database.

## 📁 Files Overview

### 1. `delete_all_data.sql`
**Purpose**: Safely delete all data from all tables
- Deletes in correct order to respect foreign key constraints
- Includes verification queries to confirm deletion
- **⚠️ Use with caution** - irreversible operation

### 2. `insert_sample_data.sql`
**Purpose**: Insert comprehensive sample data for testing
- 10 sales agents with realistic names and commission rates
- 10 routes covering Karawang/Bekasi areas
- 15 customers with proper customer codes
- 15 holidays (Indonesian national holidays + weekends)
- 12 credit contracts with various tenors and products
- 25+ payment records with recent and historical data
- Sample installment coupons for testing

### 3. `insert_user_roles_sample.sql`
**Purpose**: Insert sample user roles (requires actual user IDs)
- Admin and user role examples
- **Note**: Requires real user IDs from `auth.users` table

### 4. `complete_database_reset.sql`
**Purpose**: Complete reset and repopulation in one script
- Combines deletion + insertion
- Includes progress notifications
- Final verification and business metrics summary
- **Recommended for development environments**

## 🚀 How to Use

### Method 1: Complete Reset (Recommended for Dev)
```sql
-- Run this in Supabase SQL Editor or psql
\i supabase/complete_database_reset.sql
```

### Method 2: Step by Step
```sql
-- Step 1: Delete existing data
\i supabase/delete_all_data.sql

-- Step 2: Insert sample data
\i supabase/insert_sample_data.sql

-- Step 3: (Optional) Add user roles
-- First get actual user IDs:
SELECT id, email FROM auth.users;
-- Then modify and run:
\i supabase/insert_user_roles_sample.sql
```

### Method 3: Supabase Dashboard
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `complete_database_reset.sql`
3. Paste and click "Run"

## 📊 Sample Data Overview

### Sales Agents (10 records)
- Agent codes: S001 to S010
- Commission rates: 4.0% to 6.0%
- Indonesian names with phone numbers

### Routes (10 records)
- Covers Karawang and Bekasi areas
- Each route assigned to a default collector
- Route codes: RT001 to RT010

### Customers (15 records)
- Customer codes: C001 to C015
- Realistic addresses in coverage areas
- Assigned to sales agents and routes

### Credit Contracts (12 records)
- Various products: Electronics, Furniture, Motors, etc.
- Tenors: 60-150 days
- Different progress stages (some near completion)
- Omset ranges: 3.6M to 18M rupiah

### Payment Logs (25+ records)
- Recent payments for dashboard trends
- Historical payments across different dates
- Amounts matching contract installments

### Installment Coupons (10+ records)
- Mix of paid and unpaid statuses
- For testing voucher generation
- Due dates spread across current period

## 🎯 Business Scenarios Covered

### Dashboard Testing
- Recent payment activity for 30-day trends
- Agent performance comparison
- Collection metrics and KPIs

### Voucher Generation Testing
- Contracts with different tenor lengths
- Various customer codes for sorting
- Different completion stages

### Collection Management
- Unpaid coupons for follow-up
- Payment history tracking
- Route-based organization

### Agent Performance
- Commission calculations
- Omset vs loan amounts
- Contract acquisition history

## 🔍 Verification Queries

### Check Data Population
```sql
SELECT table_name, COUNT(*) as records 
FROM (
    SELECT 'sales_agents' as table_name FROM sales_agents
    UNION ALL SELECT 'customers' FROM customers
    UNION ALL SELECT 'credit_contracts' FROM credit_contracts
    UNION ALL SELECT 'payment_logs' FROM payment_logs
) t 
GROUP BY table_name;
```

### Business Metrics Summary
```sql
SELECT 
    'Total Omset' as metric, SUM(omset) as value FROM credit_contracts
UNION ALL
SELECT 'Total Payments', SUM(amount_paid) FROM payment_logs
UNION ALL
SELECT 'Active Contracts', COUNT(*) FROM credit_contracts WHERE status = 'active'
UNION ALL
SELECT 'Unpaid Coupons', COUNT(*) FROM installment_coupons WHERE status = 'unpaid';
```

## ⚠️ Important Notes

### Production Safety
- **Never run these scripts in production**
- Always backup before running delete operations
- Test in development environment first

### User Roles
- `user_roles` table requires actual user IDs from authentication
- Default script uses placeholder UUIDs
- Replace with real user IDs for testing authentication

### Date Dependencies
- Some dates are relative to current date
- Holiday data includes 2025 Indonesian calendar
- Payment dates include recent entries for trend testing

### Foreign Key Dependencies
- Scripts respect database constraints
- Deletion order: payment_logs → installment_coupons → credit_contracts → customers → routes → sales_agents
- Insertion order: reverse of deletion

## 🧪 Testing Scenarios

### Frontend Testing
- Dashboard with realistic data
- Agent performance comparisons
- Payment trend visualization
- Customer and contract management

### Voucher System Testing
- Different tenor lengths (60-150 days)
- Customer code sorting (C001-C015)
- Background color logic (near completion contracts)
- Proper contract progress tracking

### Business Logic Testing
- Commission calculations
- Collection tracking
- Route management
- Holiday handling in date calculations

Date: December 27, 2025