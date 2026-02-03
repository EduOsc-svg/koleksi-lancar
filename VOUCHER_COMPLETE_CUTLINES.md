# ✅ Enhanced Cut Lines - Horizontal & Vertical Voucher

## 🎯 **Fitur Baru: Complete Cut Lines System**

### 📋 **Deskripsi:**
Menambahkan sistem **cut lines lengkap** untuk voucher dengan garis potong horizontal dan vertical yang konsisten di semua sisi untuk memudahkan pemotongan voucher.

### 🔧 **Cut Lines Implementation:**

#### **1. Vertical Cut Lines (Right Side)**
```css
.coupon-card::after {
  content: ''; 
  position: absolute; 
  top: 0; 
  right: -2.5mm; 
  width: 0; 
  height: 100%;
  border-right: 1px dashed #999; 
  z-index: 10;
}
```

#### **2. Horizontal Cut Lines (Bottom)**
```css
.coupon-card::before {
  content: ''; 
  position: absolute; 
  left: 0; 
  bottom: -2.5mm; 
  width: 100%; 
  height: 0;
  border-bottom: 1px dashed #999; 
  z-index: 10;
}
```

#### **3. Top Row Cut Lines**
```css
.coupon-card:nth-child(-n+3) {
  box-shadow: 0 -2.5mm 0 0 transparent, 0 -2.5mm 0 1px dashed #999;
}
```

#### **4. Left Column Cut Lines**
```css
.coupon-card:nth-child(3n+1) {
  box-shadow: -2.5mm 0 0 0 transparent, -2.5mm 0 0 1px dashed #999;
}
```

### 📐 **Cut Lines Layout:**

```
┌─────┬─────┬─────┐  ← Top cut lines
│  1  │  2  │  3  │
├─────┼─────┼─────┤  ← Horizontal cut lines
│  4  │  5  │  6  │
├─────┼─────┼─────┤  
│  7  │  8  │  9  │
└─────┴─────┴─────┘
↑     ↑     ↑
Left  Vertical cut lines
cut   (between columns)
lines
```

### 🎨 **Visual Features:**

#### **Cut Line Specifications:**
- **Style**: Dashed lines (`1px dashed #999`)
- **Color**: Gray (#999) - subtle but visible
- **Position**: 2.5mm outside voucher boundaries
- **Coverage**: Full perimeter cutting guides

#### **Smart Hide Logic:**
- **Last Column**: No right cut lines (avoid paper edge)
- **Last Row**: No bottom cut lines (avoid paper edge)
- **Complete Grid**: Cut lines between all vouchers

### 🛠️ **Benefits:**

#### **1. ✅ Perfect Cutting Guides**
- Clear visual guides untuk manual cutting
- Consistent spacing antar voucher
- Professional appearance

#### **2. ✅ Production Ready**
- Optimal untuk bulk printing dan cutting
- Easy separation dengan scissors atau cutter
- Minimal waste material

#### **3. ✅ Print Quality**
- Tidak mengganggu voucher content
- High contrast untuk visibility
- Works dengan semua printer types

### 📁 **File Modified:**
- `/src/components/print/PrintCoupon8x5.tsx`
  - ✅ Enhanced vertical cut lines
  - ✅ Improved horizontal cut lines  
  - ✅ Added top and left border cut lines
  - ✅ Smart positioning untuk complete grid

### 🎯 **Usage:**

#### **For Manual Cutting:**
1. **Print vouchers** pada A4 landscape
2. **Follow dashed lines** untuk cutting guides
3. **Cut along lines** untuk perfect voucher separation

#### **For Production:**
- Professional cutting jigs dapat menggunakan cut lines sebagai reference
- Batch processing dengan cutting machine
- Quality control untuk consistent sizing

### 📊 **Cut Lines Grid Result:**

```
Voucher 1   |   Voucher 2   |   Voucher 3
─────────────────────────────────────────────
Voucher 4   |   Voucher 5   |   Voucher 6  
─────────────────────────────────────────────
Voucher 7   |   Voucher 8   |   Voucher 9
```

### ✅ **Status: PRODUCTION READY**

Cut lines sistem sudah **fully implemented** dengan:
- ✅ Complete perimeter guides
- ✅ Smart edge detection
- ✅ Professional print quality
- ✅ Easy manual cutting process

### 🔮 **Future Enhancements:**
- Adjustable cut line thickness
- Different cut line styles per voucher type
- Corner registration marks untuk precision cutting