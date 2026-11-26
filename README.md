# Sistem Perpustakaan — SMK Muhammadiyah Pakem

Aplikasi web manajemen sirkulasi, katalog inventaris buku, direktori anggota, kartu digital SmartPass, dan cetak struk pengembalian/denda untuk **Perpustakaan SMK Muhammadiyah Pakem**.

## Cara Memindahkan & Menjalankan di Visual Studio Code

### 1. Prasyarat
Pastikan di komputer Anda sudah terpasang:
- **Node.js** versi 20 atau terbaru ([nodejs.org](https://nodejs.org/))
- **Visual Studio Code** ([code.visualstudio.com](https://code.visualstudio.com/))

### 2. Buka Proyek di VS Code
1. Unduh seluruh proyek ini (atau ekstrak file `perpustakaan-smk-pakem-vscode.zip`).
2. Buka **Visual Studio Code**.
3. Klik **File → Open Folder...** lalu pilih folder proyek hasil ekstraksi.
4. Jika muncul pop-up rekomendasi ekstensi di pojok kanan bawah (dari `.vscode/extensions.json`), klik **Install** agar dukungan Tailwind CSS v4 & TypeScript aktif otomatis.

### 3. Instal Dependensi & Jalankan Aplikasi
Buka terminal di dalam VS Code dengan menekan **`Ctrl + ~`** (atau menu **Terminal → New Terminal**), lalu jalankan perintah berikut secara berurutan:

```bash
npm install
npm run dev
```

Setelah server berjalan, buka browser dan akses:
- **http://localhost:3000**

### 4. Perintah Lainnya
- **Cek TypeScript / Lint**: `npm run lint`
- **Build Produksi** (menghasilkan folder `dist/`): `npm run build`
- **Preview Hasil Build**: `npm run preview`

## Struktur Folder Utama
- `src/App.tsx` — Root aplikasi & router halaman
- `src/context/LibraryContext.tsx` — State global sirkulasi, katalog, anggota, dan penyimpanan `localStorage`
- `src/data/libraryData.ts` — Data awal koleksi buku, anggota, transaksi, dan pengaturan
- `src/components/` — Shell navigasi (`Layout.tsx`) dan komponen gambar (`SafeImage.tsx`)
- `src/pages/` — Seluruh halaman fitur (`DashboardPage`, `CatalogPage`, `CirculationPage`, `MembersPage`, `MemberDetailPage`, `MemberCardPage`, `ReceiptPage`, `SettingsPage`)
- `.vscode/` — Konfigurasi workspace, task, dan rekomendasi ekstensi VS Code
