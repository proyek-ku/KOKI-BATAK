# Project Context
Workspace ini digunakan untuk pengembangan aplikasi web dengan 3 kemungkinan arsitektur (stack) teknologi:
1. **XAMPP Stack:** PHP Native/MVC, MySQL, dan Bootstrap 5 (Monolitik).
2. **GAS Web App Stack:** Antarmuka dan backend menyatu di Google Apps Script (`HtmlService`), database Google Sheets.
3. **Serverless API Stack (GitHub + GAS API + GDrive):** Frontend di-host di GitHub (HTML/JS/Bootstrap), Backend API di Google Apps Script (mengembalikan JSON), dan penyimpanan media di Google Drive.

# About Me
Saya adalah pengembang web yang menyukai kode yang rapi, efisien, aman, dan mematuhi *best practices* spesifik dari setiap *stack* teknologi. Saya menginginkan arsitektur yang modular dan terukur. Saya lebih suka Anda jujur jika tidak mengetahui sesuatu daripada Anda memberikan kode tebakan yang salah dan membuang waktu saya untuk melakukan debugging.

# Workflow Initialization (SANGAT PENTING)
Setiap kali saya meminta fitur baru atau memulai proyek, **JANGAN LANGSUNG MENULIS KODE.** Tanyakan 2 hal ini terlebih dahulu:
1. **"Stack teknologi apa yang kita gunakan? (Pilih: 1. XAMPP, 2. GAS Web App, atau 3. Serverless GitHub+GAS API)"**
2. **"Apa spesifikasi detail dari fitur atau komponen yang ingin dibuat?"**

Setelah saya menjawab, terapkan aturan yang sesuai dengan pilihan saya secara ketat:

---

# Aturan Khusus 1: XAMPP Stack (PHP & MySQL)
- Gunakan Prepared Statements (PDO) untuk SEMUA query database. Hindari SQL Injection.
- Sanitasi semua input (`$_POST`, `$_GET`) dengan `htmlspecialchars()`.
- Pisahkan logika pemrosesan data (folder `/actions`) dari tampilan HTML (folder `/views`).
- Gunakan Bootstrap 5 untuk styling komponen.

---

# Aturan Khusus 2: GAS Web App Stack (Apps Script HTML Service)
- Fungsi utama adalah `doGet(e)` yang merender file `Index.html` menggunakan `HtmlService`.
- Komunikasi klien-server menggunakan `google.script.run.withSuccessHandler()`.
- Lakukan operasi massal (batch) pada Google Sheets (`getValues()`, `setValues()`), dilarang menggunakan `getValue()` dalam *looping*.
- Gunakan sistem templating `<?!= include('nama_file'); ?>` untuk memisahkan JS dan CSS.

---

# Aturan Khusus 3: Serverless API Stack (GitHub Frontend + GAS API + GDrive)

## Backend (Google Apps Script sebagai API)
- **Output JSON:** Fungsi `doGet(e)` atau `doPost(e)` HARUS mengembalikan data dalam format JSON menggunakan `ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);`.
- **CORS:** Pastikan API mendukung pemanggilan dari domain luar (GitHub) dengan menangani parameter URL dengan benar.
- **Manajemen Media (GDrive):** Untuk fitur unggah gambar/file, gunakan `DriveApp.createFile()`. Pastikan file diatur visibilitasnya menjadi publik (jika perlu ditampilkan di web), dan kembalikan URL file tersebut dalam respons JSON.

## Frontend (GitHub Hosting)
- **Struktur File:** Buat file HTML murni, CSS, dan JavaScript terpisah (misalnya `index.html`, `style.css`, `app.js`).
- **Fetch API:** Gunakan Vanilla JavaScript `fetch()` modern (dengan `async/await`) untuk memanggil URL API (Web App URL) dari GAS.
- **State UI:** Selalu sediakan elemen indikator *loading* di HTML saat `fetch()` sedang mengambil atau mengirim data ke GAS.
- **Desain:** Gunakan Bootstrap 5 via CDN untuk responsivitas antarmuka.

---

# Aturan Umum & Eksekusi Anti-Halusinasi (Berlaku untuk Semua Stack)
- **DILARANG MENEBAK:** Jika Anda tidak yakin tentang sintaks, nama fungsi bawaan, atau dokumentasi spesifik, JANGAN mengarangnya. Berhentilah dan katakan: "Saya tidak yakin tentang bagian ini, apakah Anda memiliki referensi dokumentasinya?"
- **DILARANG BERASUMSI:** Jika instruksi saya kurang detail, Anda WAJIB berhenti dan mengajukan pertanyaan klarifikasi sebelum menulis kode.
- **VERIFIKASI DATA:** Jangan pernah menulis logika yang memanipulasi database (MySQL atau eksekusi ke Google Sheets) tanpa terlebih dahulu mengonfirmasi struktur tabel/kolom yang tepat kepada saya.
- **GUNAKAN STANDAR YANG ADA:** Selalu prioritaskan komponen bawaan Bootstrap 5 dan Vanilla JavaScript. Jangan menyarankan untuk menginstal *library* pihak ketiga tambahan kecuali saya yang memintanya.
- **TUNJUKKAN RENCANA (PLAN MODE):** Sebelum menulis baris kode untuk file yang kompleks, buat daftar rencana langkah logika Anda dan minta persetujuan saya.
- **KOMENTAR KODE:** Tuliskan komentar penjelas yang singkat pada bagian logika yang rumit agar mudah dikelola di masa mendatang.