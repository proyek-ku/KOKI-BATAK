# 🍛 Koki Batak — Website Catering (Serverless)

Website pemesanan catering khas Batak dengan **2 sisi**: publik/user (katalog, keranjang, pemesanan via WhatsApp) dan **admin** (kelola paket, pesanan, galeri, testimoni).

**Arsitektur (Serverless, gratis):**
- **Frontend** — HTML/CSS/JS statis (publik: CSS custom; admin: Bootstrap 5) di **GitHub Pages**
- **Backend API** — **Google Apps Script** (Web App, JSON via `ContentService`)
- **Database** — **Google Sheets**
- **Media** — **Google Drive**

---

## 📁 Struktur Proyek

```
index.html, menu.html, galeri.html, testimoni.html,
keranjang.html, tentang.html, kontak.html   → halaman publik
css/base.css, css/components.css            → design system (tema Batak)
js/config.js                                → ⚙️ ISI URL API DI SINI
js/api.js, ui.js, cart.js, packages.js      → inti frontend
js/home.js, menu.js, keranjang.js, ...      → logika per halaman
admin/                                       → panel admin (Bootstrap 5)
gas/Code.gs                                  → 🔑 backend (tempel ke Apps Script)
tools/test-koneksi.html                      → alat tes Fase 0 (CORS/Drive)
assets/                                       → logo.png, hero.jpg, dll.
```

---

## 🚀 Langkah Deploy

### 1. Siapkan Database & Backend (Google)
1. Buka [sheets.new](https://sheets.new) → beri nama **Koki Batak DB**.
2. Menu **Extensions → Apps Script**. Hapus isi default, **tempel seluruh isi `gas/Code.gs`**, lalu **Save**.
3. Di editor Apps Script, pilih fungsi **`setupSpreadsheet`** → **Run**.
   - Saat diminta, **Authorize** akses (akun Google Anda). Ini membuat 7 tab + header + Settings default.
4. **Akun admin — sudah otomatis dibuat** oleh `setupSpreadsheet` di langkah 3:
   - **Username:** `admin` · **Password:** `KokiBatak123`
   - **Segera ganti** password lewat menu **Profil** setelah login pertama.
   - *(Opsional)* set password sendiri dari editor: tambahkan `function gantiPw(){ setAdminPassword('PasswordBaru'); }` lalu Run, kemudian hapus fungsinya.
5. *(Opsional)* Jalankan **`seedSampleData`** sekali untuk mengisi contoh paket & testimoni.
6. *(Opsional, untuk upload gambar yang rapi)* Buat folder di Drive, salin ID-nya, lalu di Apps Script:
   **Project Settings → Script Properties → Add** `DRIVE_FOLDER_ID` = `<id folder>`.
   Jika dilewati, sistem otomatis membuat folder **"Koki Batak Uploads"**.

### 2. Deploy sebagai Web App
1. Apps Script → **Deploy → New deployment** → ikon gerigi → **Web app**.
2. Setelan:
   - **Execute as:** `Me (akun Anda)`
   - **Who has access:** `Anyone`  ← penting agar bisa dipanggil dari GitHub tanpa login Google.
3. **Deploy** → **Authorize** → **salin URL** yang berakhiran **`/exec`**.
4. Setiap kali Anda **mengubah `Code.gs`**, lakukan **Deploy → Manage deployments → Edit (pensil) → Version: New version → Deploy** agar perubahan aktif di URL yang sama.

### 3. Hubungkan Frontend
1. Buka **`js/config.js`**, ganti `API_BASE_URL` dengan URL `/exec` Anda.
2. Letakkan gambar brand di folder **`assets/`**:
   - `assets/logo.png` (logo Koki Batak)
   - `assets/hero.jpg` (foto hidangan untuk beranda — opsional)

### 4. ✅ Fase 0 — Tes Koneksi (WAJIB sebelum lanjut)
1. Unggah proyek ke GitHub & aktifkan **Settings → Pages** (branch `main`, folder `/root`).
2. Buka **`https://<user>.github.io/<repo>/tools/test-koneksi.html`**, tempel URL `/exec`, jalankan **ketiga tes**.
   - Semua ✅ → lanjut normal.
   - GET gagal tapi POST ok → set `USE_JSONP_FOR_GET = true` di `js/config.js`.
   - Gambar gagal → cek sharing file / pertimbangkan host gambar lain.

### 5. Pakai
- Situs publik: `https://<user>.github.io/<repo>/`
- Panel admin: `https://<user>.github.io/<repo>/admin/` — login dengan **username `admin`** + password dari langkah 1.4.

---

## ⚙️ Mengisi & Mengelola Data
Semua dilakukan dari **panel admin** (tanpa menyentuh Sheets/kode):
- **Paket** — tambah/edit menu, upload foto, tandai *Terlaris*, isi *Harga Diskon*.
- **Pesanan** — lihat detail & ubah status (`Baru → Dikonfirmasi → Diproses → Selesai`/`Dibatalkan`).
- **Galeri** — unggah foto dokumentasi.
- **Testimoni** — setujui/tolak testimoni yang masuk.
- **Pengaturan** — atur **Nomor WhatsApp Admin** (tujuan chat pemesanan), profil usaha, teks hero, Instagram, TikTok, alamat, peta, dan kategori paket.
- **Profil** (menu pojok kanan atas) — ganti password Anda sendiri tanpa membuka Apps Script.
- **Kelola Admin** (hanya **Owner**) — tambah/edit/nonaktifkan admin lain, atur peran **Owner** (bisa kelola admin) atau **Staff** (hanya kelola konten).

**Pengaturan bisnis** (Nomor WhatsApp Admin, Instagram, TikTok, alamat, hero, kategori) paling mudah diatur lewat menu **Pengaturan** di panel admin (atau, jika perlu, langsung di tab **Settings** pada Spreadsheet). Nomor WA boleh format `08xx` atau `628xx` — **pesanan pelanggan akan diarahkan ke nomor ini**, jadi pastikan diisi nomor admin/usaha.

---

## 🔒 Keamanan
- Mendukung **banyak admin** dengan peran **Owner** / **Staff**. Akun tersimpan di sheet `Admins`; **password disimpan sebagai hash SHA-256 + salt** (bukan teks asli). Kunci penanda-tangan token (`ADMIN_SECRET`) ada di **Script Properties**.
- Login (username + password) menghasilkan **token HMAC** berisi id admin (kedaluwarsa 8 jam) yang **diverifikasi backend pada setiap aksi admin**, termasuk cek apakah akun masih aktif — panel admin di browser bukan gerbang keamanan, backend-lah gerbangnya.
- Aksi pengelolaan admin hanya boleh oleh **Owner**; sistem mencegah owner terakhir dihapus/dinonaktifkan.
- Form publik dilindungi **honeypot** anti-spam sederhana; input disanitasi (cegah formula injection) di sisi server.
- Harga pesanan **dihitung ulang di server** (tidak mempercayai harga dari browser).
- ⚠️ Gambar Drive bersifat **publik via link** — jangan unggah dokumen rahasia ke folder upload.

---

## 🛠️ Troubleshooting
| Masalah | Solusi |
|---|---|
| Data tidak muncul / error CORS di Console | Jalankan ulang **Fase 0**. Jika GET diblokir → `USE_JSONP_FOR_GET = true`. Pastikan deployment **Who has access: Anyone**. |
| Perubahan `Code.gs` tidak berefek | **Manage deployments → New version**. Pakai URL `/exec` (bukan `/dev`). |
| Gambar tidak tampil (403) | Pastikan `<img>` memakai `referrerpolicy="no-referrer"` (sudah otomatis di kode). Pastikan file di-share *Anyone with link*. |
| "Admin belum diset" | Jalankan `setAdminPassword(...)` (langkah 1.4). |
| Upload gambar gagal | File terlalu besar (maks ~3 MB) atau kuota Drive penuh. |

## 📊 Batas (kuota harian akun Gmail biasa, perkiraan)
- Apps Script: runtime ~6 menit/eksekusi, ~90 menit total/hari — sangat cukup untuk katering kecil.
- Penyimpanan Drive: sesuai kuota akun (15 GB gratis dibagi Gmail/Drive/Foto).
- Untuk skala besar, pertimbangkan akun Google Workspace.

---
Dibuat untuk **Koki Batak Catering** • Stack: GitHub Pages + Google Apps Script + Google Drive.
