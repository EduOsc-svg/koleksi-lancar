# 🚨 Git Warning System - Quick Setup Instructions

## Instruksi Implementasi Cepat

### 1. Install Dependencies (jika diperlukan)

```bash
# Pastikan dependencies sudah ada
npm install lucide-react
# atau
yarn add lucide-react
```

### 2. Setup di Aplikasi Utama

Tambahkan `GitWarningProvider` di root aplikasi:

```tsx
import { GitWarningProvider } from "@/components/GitWarningProvider";

function App() {
  return (
    <GitWarningProvider
      threshold={3}           // Peringatan jika > 3 file berubah
      autoCheck={true}        // Monitoring otomatis
      checkInterval={60000}   // Check setiap 1 menit
      showBanner={true}       // Tampilkan banner warning
      showIndicator={true}    // Tampilkan indikator di sudut layar
    >
      {/* Your app content */}
    </GitWarningProvider>
  );
}
```

### 3. File yang Sudah Dibuat

✅ **Utilities:**
- `src/lib/gitUtils.ts` - Git operations dan status checking
- `src/hooks/useGitMonitor.ts` - React hooks untuk monitoring

✅ **Components:**
- `src/components/GitWarningBanner.tsx` - UI banner dan indicator
- `src/components/GitWarningProvider.tsx` - Provider context

✅ **Documentation:**
- `GIT_WARNING_SYSTEM.md` - Dokumentasi lengkap

### 4. Fitur yang Aktif

🔍 **Auto Monitoring**: Sistem akan secara otomatis mengecek:
- Jumlah file yang modified/added/deleted
- Status remote repository
- Memberikan peringatan jika > threshold files

⚠️ **Warning Triggers**:
- Lebih dari 3 file berubah
- Ada perubahan di remote yang belum dipull
- Working directory tidak bersih

🎯 **UI Elements**:
- **Banner Warning**: Muncul di atas ketika ada peringatan
- **Status Indicator**: Indikator kecil di sudut layar
- **Action Buttons**: Tombol untuk Pull, Commit, Push langsung dari UI

### 5. Quick Test

Untuk test sistem:

```bash
# Buat beberapa file atau modifikasi file existing
touch test1.txt test2.txt test3.txt test4.txt
echo "test" > test1.txt
echo "test" > test2.txt
echo "test" > test3.txt
echo "test" > test4.txt

# Sistem akan mendeteksi 4 file berubah dan menampilkan warning
```

### 6. Konfigurasi Environment

Pastikan:
- ✅ Git sudah ter-install
- ✅ Working directory adalah git repository
- ✅ User memiliki access git operations

### 7. Rekomendasi Settings

```tsx
// Development Environment
<GitWarningProvider
  threshold={3}
  checkInterval={30000}  // 30 detik - monitoring aktif
  showBanner={true}
  showIndicator={true}
/>

// Production Environment
<GitWarningProvider
  threshold={5}
  checkInterval={120000} // 2 menit - lebih conservative
  showBanner={true}
  showIndicator={false}  // Tidak ganggu user
/>
```

### 8. Troubleshooting Cepat

❌ **Warning tidak muncul?**
- Check console untuk error
- Pastikan ada git changes
- Verify threshold settings

❌ **Git commands error?**
- Pastikan git ter-install
- Check working directory adalah git repo
- Verify git config

### 9. Best Practices

1. **Set threshold sesuai workflow tim** (3-5 files)
2. **Adjust check interval** berdasarkan kebutuhan
3. **Monitor performance impact** jika interval terlalu kecil
4. **Inform team** tentang sistem ini

### 10. Next Steps

Setelah sistem aktif, Anda bisa:
- Customize UI sesuai theme aplikasi
- Add lebih banyak git operations
- Integrate dengan CI/CD pipeline
- Add analytics untuk git workflow

---

## 💡 Key Benefits

- ✅ **Prevent Git Conflicts**: Warning sebelum konflik terjadi
- ✅ **Improved Workflow**: UI buttons untuk git operations
- ✅ **Team Awareness**: Visual indicators untuk status git
- ✅ **Automatic Monitoring**: Tidak perlu manual check

## 📞 Support

Lihat `GIT_WARNING_SYSTEM.md` untuk dokumentasi lengkap dan troubleshooting detail.