# Git Warning System - Sistem Peringatan Git

Sistem peringatan git yang akan memberikan notifikasi ketika ada lebih dari 3 file yang berubah untuk menghindari konflik git.

## 📋 Fitur

- ✅ **Monitoring Real-time**: Memantau perubahan file secara otomatis
- ⚠️ **Peringatan Visual**: Banner dan indikator saat ada banyak perubahan
- 🔄 **Git Workflow Helper**: Tombol untuk pull, push, dan commit langsung dari UI
- 📊 **Status Detail**: Menampilkan detail jumlah file modified, added, deleted
- 🌐 **Customizable**: Threshold dan interval bisa disesuaikan
- 📱 **Responsive**: Bekerja di berbagai ukuran layar

## 🚀 Cara Penggunaan

### 1. Setup di Level Aplikasi

Tambahkan `GitWarningProvider` di root aplikasi Anda:

```tsx
import React from 'react';
import { GitWarningProvider } from '@/components/GitWarningProvider';
import App from './App';

function Root() {
  return (
    <GitWarningProvider
      threshold={3}           // Peringatan jika > 3 file berubah
      autoCheck={true}        // Auto monitoring
      checkInterval={60000}   // Check setiap 1 menit
      showBanner={true}       // Tampilkan banner warning
      showIndicator={true}    // Tampilkan indikator di sudut
      showToast={false}       // Tampilkan toast notification
      indicatorPosition="top-right"
    >
      <App />
    </GitWarningProvider>
  );
}

export default Root;
```

### 2. Penggunaan Manual dengan Hook

```tsx
import React from 'react';
import { useGitMonitor } from '@/hooks/useGitMonitor';

function MyComponent() {
  const {
    gitStatus,
    currentBranch,
    warnings,
    recommendations,
    isLoading,
    shouldWarn,
    refreshStatus
  } = useGitMonitor({
    threshold: 3,
    autoCheck: true,
    onWarning: (warnings, recommendations) => {
      console.log('Git Warning:', warnings);
    }
  });

  if (shouldWarn) {
    return (
      <div>
        <h3>Git Warning</h3>
        <p>Branch: {currentBranch}</p>
        <p>Modified Files: {gitStatus?.totalChanges}</p>
        <ul>
          {warnings.map((warning, i) => (
            <li key={i}>{warning}</li>
          ))}
        </ul>
      </div>
    );
  }

  return <div>No git warnings</div>;
}
```

### 3. Komponen Standalone

```tsx
import React from 'react';
import { GitWarningBanner, GitStatusIndicator } from '@/components/GitWarningBanner';

function Dashboard() {
  return (
    <div>
      {/* Banner warning akan muncul otomatis jika ada peringatan */}
      <GitWarningBanner threshold={3} />
      
      {/* Indikator kecil di sudut layar */}
      <GitStatusIndicator 
        threshold={3} 
        position="bottom-right" 
      />
      
      {/* Konten dashboard lainnya */}
    </div>
  );
}
```

## 🔧 API Reference

### GitWarningProvider Props

| Prop | Type | Default | Deskripsi |
|------|------|---------|-----------|
| `threshold` | `number` | `3` | Jumlah file minimum untuk memicu peringatan |
| `autoCheck` | `boolean` | `true` | Auto monitoring git status |
| `checkInterval` | `number` | `60000` | Interval check dalam milliseconds |
| `showBanner` | `boolean` | `true` | Tampilkan banner warning |
| `showIndicator` | `boolean` | `true` | Tampilkan status indicator |
| `showToast` | `boolean` | `false` | Tampilkan toast notification |
| `indicatorPosition` | `string` | `"top-right"` | Posisi indicator |

### useGitMonitor Hook

```tsx
const {
  gitStatus,          // Detail status git
  currentBranch,      // Nama branch saat ini
  warnings,           // Array pesan peringatan
  recommendations,    // Array rekomendasi
  isLoading,          // Status loading
  shouldWarn,         // Boolean apakah perlu warning
  refreshStatus       // Function untuk refresh manual
} = useGitMonitor(options);
```

### GitStatus Interface

```tsx
interface GitStatus {
  modifiedFiles: number;    // Jumlah file yang dimodifikasi
  addedFiles: number;       // Jumlah file yang ditambah
  deletedFiles: number;     // Jumlah file yang dihapus
  totalChanges: number;     // Total perubahan
  hasChanges: boolean;      // Ada perubahan atau tidak
  isMoreThan3Files: boolean; // Lebih dari threshold
}
```

## 📊 Git Utilities

Library ini juga menyediakan utility functions untuk git operations:

```tsx
import {
  getGitStatus,
  checkRemoteChanges,
  getCurrentBranch,
  isWorkingDirectoryClean,
  pullFromRemote,
  pushToRemote,
  commitAllChanges,
  checkGitWarnings
} from '@/lib/gitUtils';

// Contoh penggunaan
async function handleGitWorkflow() {
  const status = await getGitStatus();
  
  if (status.isMoreThan3Files) {
    const hasRemoteChanges = await checkRemoteChanges();
    
    if (hasRemoteChanges) {
      // Pull first
      const pullResult = await pullFromRemote();
      console.log('Pull result:', pullResult);
    }
    
    // Commit changes
    const commitResult = await commitAllChanges('Auto commit: multiple files changed');
    
    // Push changes
    const pushResult = await pushToRemote();
    console.log('Push result:', pushResult);
  }
}
```

## ⚙️ Konfigurasi

### Environment Setup

Pastikan git sudah terkonfigurasi di environment:

```bash
# Check git config
git config --list

# Set user jika belum
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

### Permissions

Sistem membutuhkan akses untuk menjalankan git commands. Pastikan:

1. Git sudah ter-install
2. Working directory adalah git repository
3. User memiliki akses read/write ke repository

## 🛠️ Customization

### Custom Warning Logic

```tsx
const customWarningChecker = async () => {
  const status = await getGitStatus();
  const warningRules = [
    {
      condition: status.modifiedFiles > 5,
      message: "Terlalu banyak file dimodifikasi",
      severity: "high"
    },
    {
      condition: status.addedFiles > 10,
      message: "Terlalu banyak file baru",
      severity: "medium"
    }
  ];
  
  return warningRules.filter(rule => rule.condition);
};
```

### Custom UI Components

```tsx
import { useGitMonitor } from '@/hooks/useGitMonitor';

function CustomGitWarning() {
  const { gitStatus, warnings, shouldWarn } = useGitMonitor();
  
  if (!shouldWarn) return null;
  
  return (
    <div className="custom-git-warning">
      <h3>🚨 Git Workflow Warning</h3>
      <div className="stats">
        <span>Modified: {gitStatus?.modifiedFiles}</span>
        <span>Added: {gitStatus?.addedFiles}</span>
        <span>Deleted: {gitStatus?.deletedFiles}</span>
      </div>
      <div className="actions">
        <button onClick={handleCommitAll}>Commit All</button>
        <button onClick={handlePushAll}>Push All</button>
      </div>
    </div>
  );
}
```

## 🚨 Skenario Peringatan

### Skenario 1: Banyak File Berubah
```
⚠️ Terdeteksi 5 file yang berubah (lebih dari 3 file)
💡 Pertimbangkan untuk melakukan commit dan push untuk menghindari konflik
```

### Skenario 2: Remote Changes
```
⚠️ Ada perubahan baru di remote repository
💡 Lakukan git pull terlebih dahulu sebelum push
```

### Skenario 3: Kombinasi
```
⚠️ Terdeteksi 4 file yang berubah (lebih dari 3 file)
⚠️ Ada perubahan baru di remote repository
💡 Lakukan git pull terlebih dahulu sebelum push
💡 Pertimbangkan untuk melakukan commit dan push untuk menghindari konflik
```

## 🔍 Troubleshooting

### Error: "git command not found"
```bash
# Install git
sudo apt-get install git  # Ubuntu/Debian
brew install git           # macOS
```

### Error: "Not a git repository"
```bash
# Initialize git repo
git init
git remote add origin <repository-url>
```

### Error: Permission denied
```bash
# Check git credentials
git config --list
```

### Warning tidak muncul
1. Pastikan threshold sudah benar
2. Check apakah autoCheck aktif
3. Periksa console untuk error
4. Pastikan ada perubahan file yang terdeteksi

## 📝 Best Practices

1. **Set Threshold yang Tepat**: Sesuaikan dengan workflow tim (biasanya 3-5 file)
2. **Check Interval**: Jangan terlalu sering (minimum 30 detik)
3. **Monitor Performance**: Auto-checking bisa mempengaruhi performa
4. **Use with CI/CD**: Integrasikan dengan pipeline CI/CD
5. **Team Communication**: Informasikan tim tentang sistem peringatan

## 🤝 Contributing

Untuk mengembangkan fitur lebih lanjut:

1. Fork repository
2. Buat feature branch
3. Implementasi perubahan
4. Test thoroughly
5. Submit pull request

## 📄 License

MIT License - see LICENSE file for details.