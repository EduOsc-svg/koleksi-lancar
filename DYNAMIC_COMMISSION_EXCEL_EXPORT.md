# ✅ Dynamic Commission Excel Export Enhancement

## 🎯 **Feature Overview:**
Export Excel Sales Agents dengan kolom komisi yang dinamis berdasarkan ketentuan commission tiers yang sudah diatur sebelumnya.

## 🔧 **Technical Implementation:**

### **1. 📊 Enhanced Imports:**
```typescript
import { useCommissionTiers, calculateTieredCommission } from "@/hooks/useCommissionTiers";
```

### **2. 🎪 Component Enhancement:**
```typescript
export default function SalesAgents() {
  // ... existing hooks
  const { data: commissionTiers } = useCommissionTiers();
  // ... rest of component
}
```

### **3. 💫 Dynamic Commission Calculation:**
```typescript
// Calculate dynamic commission percentage based on omset using tiers
const totalOmset = omsetData?.total_omset || 0;
const dynamicCommissionPct = calculateTieredCommission(totalOmset, commissionTiers) / 100;
```

## 🎨 **Excel Structure Enhancement:**

### **📋 Main Sheet - "Sales Agents":**

#### **Updated Columns:**
| Column | Header | Description |
|--------|--------|-------------|
| A | Kode Agent | Agent code |
| B | Nama | Agent name |
| C | Telepon | Phone number |
| D | **Komisi % (Dinamis)** | **Dynamic commission based on tier** |
| E | Total Omset | Total omset amount |
| F | Total Modal | Total capital |
| G | Profit | Calculated profit (E-F) |
| H | **Komisi (Berdasarkan Tier)** | **Dynamic commission amount** |
| I | Jumlah Kontrak | Contract count |

#### **📋 Key Enhancements:**
- **Column D**: Dynamically calculated based on omset tier (not fixed percentage)
- **Column H**: Commission calculated using tier-based percentage
- **Formula preserved**: `H = G × D` (Profit × Dynamic Commission %)

### **📊 New Sheet - "Ketentuan Komisi":**

#### **Tier Reference Information:**
| Column | Header | Description |
|--------|--------|-------------|
| A | Rentang Omset Minimum | Minimum omset for tier |
| B | Rentang Omset Maksimum | Maximum omset (or "Tidak Terbatas") |
| C | Persentase Komisi | Commission percentage |
| D | Keterangan | Tier description |

#### **📝 Explanation Section:**
- **System explanation** in Indonesian
- **Calculation formula** explanation  
- **Motivation context** for tier-based commission

## 🚀 **Dynamic Logic Implementation:**

### **🧮 Commission Calculation Flow:**
1. **Get agent's total omset** from existing data
2. **Apply tier matching** using `calculateTieredCommission()`
3. **Convert to decimal** for Excel formula compatibility
4. **Formula calculation**: Profit × Dynamic Commission %

### **🔍 Tier Matching Logic:**
```typescript
const dynamicCommissionPct = calculateTieredCommission(totalOmset, commissionTiers) / 100;

// Example:
// Omset: Rp 50,000,000
// Tier: 30M-70M = 6%
// Result: 0.06 (6%)
```

### **📊 Validation & Fallback:**
```typescript
if (!commissionTiers || commissionTiers.length === 0) {
  toast.error("Ketentuan komisi belum diatur. Silakan atur terlebih dahulu.");
  return;
}
```

## 🎨 **Visual Enhancements:**

### **📋 Updated File Naming:**
```typescript
a.download = `sales-agents-komisi-dinamis-${new Date().toISOString().split("T")[0]}.xlsx`;
```

### **🎯 Enhanced Toast Message:**
```typescript
toast.success("Excel berhasil di-export dengan komisi dinamis berdasarkan ketentuan tier!");
```

### **🎨 Tier Sheet Styling:**
```typescript
// Green header for tier sheet
tiersSheet.getRow(1).fill = {
  type: "pattern", 
  pattern: "solid",
  fgColor: { argb: "FF2F5233" }
};
```

## 💡 **Business Logic Benefits:**

### **1. 🎯 Accurate Commission Calculation:**
- **Real-time tier matching** based on actual omset
- **Automatic percentage adjustment** per agent performance
- **No manual intervention** required for commission calculation

### **2. 📊 Transparent Reporting:**
- **Clear tier visualization** in dedicated sheet
- **Formula transparency** showing calculation method  
- **Reference documentation** included in Excel file

### **3. 🚀 Performance Motivation:**
- **Tiered commission structure** motivates higher performance
- **Clear targets** visible in tier breakdown
- **Performance-based rewards** automatically calculated

## 🔧 **Technical Features:**

### **✅ Error Handling:**
- **Tier availability check** before export
- **Graceful fallback** if no tiers configured
- **User-friendly error messages**

### **✅ Data Integrity:**
- **Consistent decimal formatting** for percentages
- **Proper currency formatting** for amounts
- **Formula preservation** for calculation transparency

### **✅ User Experience:**
- **Enhanced file naming** with "komisi-dinamis" identifier
- **Two-sheet structure** for data + reference
- **Clear column headers** indicating dynamic calculation

## 📋 **Usage Workflow:**

1. **Setup Commission Tiers** (via Ketentuan Komisi dialog)
2. **Export Excel** from Sales Agents page  
3. **Review Dynamic Commission** in main sheet
4. **Reference Tier Rules** in second sheet
5. **Verify Calculations** using provided formulas

## ✅ **Result:**
- ✅ **Dynamic commission calculation** based on omset tiers
- ✅ **Automated tier matching** for each sales agent
- ✅ **Comprehensive Excel report** with tier reference
- ✅ **Transparent calculation** with preserved formulas
- ✅ **Performance-driven commission** structure

**Perfect dynamic commission system integrated with Excel export functionality!** ✨💰📊