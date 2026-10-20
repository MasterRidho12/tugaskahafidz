# Kainara - Fitur Panduan Ukuran (Size Chart) Menggunakan Shopify Metaobject

Implementasi fitur **Size Chart Terpusat** pada tema **Shopify Dawn (Online Store 2.0)** menggunakan arsitektur **Metaobject & Metafield**.

---

## 📌 Daftar Isi
1. [Latar Belakang & Fitur Utama](#-latar-belakang--fitur-utama)
2. [Arsitektur Data: Metaobject & Metafield](#-arsitektur-data-metaobject--metafield)
3. [Daftar File yang Dibuat & Diubah](#-daftar-file-yang-dibuat--diubah)
4. [Panduan untuk Admin Toko](#-panduan-untuk-admin-toko)
5. [Logika Pengujian 4 Skenario (Fallback Matrix)](#-logika-pengujian-4-skenario-fallback-matrix)
6. [Fitur Aksesibilitas & Interaktivitas](#-fitur-aksesibilitas--interaktivitas)
7. [Fitur Bonus (Nilai Tambah)](#-fitur-bonus-nilai-tambah)
8. [Verifikasi Theme Check & Alur Developer](#-verifikasi-theme-check--alur-developer)

---

## 🎯 Latar Belakang & Fitur Utama

Sebelumnya, panduan ukuran diunggah sebagai file gambar di deskripsi produk, yang menyulitkan pembaruan, tidak konsisten, dan kurang nyaman dibaca di perangkat mobile.

Dengan implementasi ini:
- **Terpusat (Single Source of Truth)**: Data ukuran disimpan dalam Metaobject. Cukup perbarui satu nilai di admin, seluruh produk yang menggunakannya akan terbarui otomatis.
- **Dinamis & Bebas Hardcode**: Kolom tabel yang tidak diisi pada semua baris otomatis disembunyikan (misal: kebaya/dress tidak menampilkan kolom Lebar Bahu).
- **Toggle Satuan Real-Time**: Pembeli dapat berpindah antara satuan **cm** dan **inci** tanpa perlu memuat ulang halaman (1 inci = 2,54 cm, dibulatkan 1 desimal). Preferensi satuan tersimpan di `localStorage`.
- **Aksesibel & Responsif**: Menggunakan dialog modal aksesibel (mendukung tombol ESC, overlay click, penutupan dengan tombol silang, serta focus trap). Pada layar smartphone, kolom ukuran tetap *sticky* saat tabel di-scroll secara horizontal.
- **Multilingual (Bilingual)**: Semua teks menggunakan filter locales (`locales/en.default.json` dan `locales/id.json`), 100% bebas hardcoded text.

---

## 🗄️ Arsitektur Data: Metaobject & Metafield

### 1. Metaobject Definition: `size_chart_row` (Baris Ukuran)
Menyimpan satu baris data ukuran (misalnya: S, M, L, XL, atau S/M, L/XL).

| Field Key | Tipe Data | Wajib | Keterangan |
|---|---|---|---|
| `size` | Single line text | **Ya** | Label ukuran (misal: "S", "M", "L", "S/M") |
| `chest_cm` | Decimal | Tidak | Lingkar dada dalam cm |
| `waist_cm` | Decimal | Tidak | Lingkar pinggang dalam cm |
| `hip_cm` | Decimal | Tidak | Lingkar pinggul dalam cm |
| `length_cm` | Decimal | Tidak | Panjang baju/badan dalam cm |
| `shoulder_cm` | Decimal | Tidak | Lebar bahu dalam cm |
| `sleeve_cm` | Decimal | Tidak | Panjang lengan dalam cm |

### 2. Metaobject Definition: `size_chart` (Tabel Panduan Ukuran)
Menyimpan informasi tabel panduan ukuran yang dapat dipasangkan ke produk atau koleksi.

| Field Key | Tipe Data | Wajib | Keterangan |
|---|---|---|---|
| `title` | Single line text | **Ya** | Judul chart (misal: "Kemeja Pria Regular Fit") |
| `description` | Multi-line text | Tidak | Catatan toleransi ukuran (misal: "Toleransi ukuran 1-2 cm") |
| `rows` | List of metaobject references (`size_chart_row`) | **Ya** | Daftar baris ukuran berurutan |
| `guide_image` | File (image) | Tidak | Gambar/ilustrasi cara mengukur tubuh |
| `notes` | Rich text | Tidak | Catatan tambahan (misal info model: "Model memakai size S-M, TB 173 cm, BB 49 kg") |

### 3. Metafield Definitions
- **Product Metafield**:
  - Namespace & Key: `custom.size_chart`
  - Tipe: Metaobject Reference ke `size_chart`
  - Fungsi: Menentukan size chart spesifik untuk suatu produk (prioritas utama).
- **Collection Metafield**:
  - Namespace & Key: `custom.default_size_chart`
  - Tipe: Metaobject Reference ke `size_chart`
  - Fungsi: Menentukan size chart default untuk produk-produk di dalam koleksi tersebut (prioritas fallback).

---

## 📂 Daftar File yang Dibuat & Diubah

| File | Status | Keterangan |
|---|---|---|
| `snippets/size-chart.liquid` | **Dibuat Baru** | Snippet Liquid yang menangani logika fallback, pengecekan kolom dinamis, markup modal `<dialog>`, dan binding data `data-cm`. |
| `assets/size-chart.css` | **Dibuat Baru** | Stylesheet untuk styling trigger button, slide drawer modal, sticky first column di mobile, dan pill toggle. |
| `assets/size-chart.js` | **Dibuat Baru** | Vanilla JavaScript untuk membuka/menutup modal, focus trap, toggle satuan (cm ↔ inch) via `localStorage`, dan fitur pencari rekomendasi ukuran. |
| `sections/main-product.liquid` | **Diubah** | Mendaftarkan block `size_chart` pada schema dan merender `snippets/size-chart.liquid`. |
| `templates/product.json` | **Diubah** | Menambahkan block `size_chart` pada posisi yang tepat (di sebelah varian ukuran) pada template default produk. |
| `locales/en.default.json` | **Diubah** | Menambahkan terjemahan bahasa Inggris untuk semua teks antarmuka size chart. |
| `locales/id.json` | **Diubah** | Menambahkan terjemahan bahasa Indonesia untuk semua teks antarmuka size chart. |
| `locales/en.default.schema.json` | **Diubah** | Mendaftarkan label dan opsi pengaturan block Theme Editor. |
| `.theme-check.yml` | **Dibuat Baru** | Konfigurasi linter Shopify Theme Check agar valid dan bebas error. |

---

## 👩‍💼 Panduan untuk Admin Toko

### Langkah 1: Membuat Baris Ukuran (`size_chart_row`)
1. Buka **Shopify Admin** → **Content** → **Metaobjects**.
2. Pilih definisi **`size_chart_row`**.
3. Klik tombol **Add entry**.
4. Isi ukuran (`size`, misal `S`), serta ukuran tubuh dalam cm (misal `chest_cm`: `94`, `length_cm`: `70`). Kosongkan field yang tidak relevan dengan produk.
5. Klik **Save**.
6. Ulangi untuk ukuran `M`, `L`, `XL`, dst.

### Langkah 2: Membuat Size Chart (`size_chart`)
1. Buka **Shopify Admin** → **Content** → **Metaobjects**.
2. Pilih definisi **`size_chart`**.
3. Klik tombol **Add entry**.
4. Isi field:
   - **Title**: Contoh `"Kemeja Pria Regular Fit"` atau `"Thea Kebaya Top"`.
   - **Description**: Contoh `"Toleransi +/- 1 cm"`.
   - **Rows**: Klik **Select entries**, lalu pilih baris ukuran yang sudah dibuat sebelumnya secara berurutan (S, M, L, XL).
   - **Guide Image** (opsional): Unggah ilustrasi panduan pengukuran.
   - **Notes** (opsional): Isi catatan panduan pemilihan ukuran atau tinggi/berat badan model.
5. Klik **Save**.

### Langkah 3: Memasang ke Koleksi (Default Fallback)
1. Buka **Products** → **Collections**.
2. Buka koleksi yang diinginkan (misal koleksi `"Kemeja"`).
3. Scroll ke bagian paling bawah ke bagian **Metafields**.
4. Pada field **Default Size Chart (`custom.default_size_chart`)**, pilih size chart yang sesuai.
5. Klik **Save**. Seluruh produk di koleksi ini otomatis memakai size chart tersebut jika produk belum diatur secara spesifik.

### Langkah 4: Memasang ke Produk Spesifik (Override)
1. Buka **Products** → pilih produk yang diinginkan.
2. Scroll ke bagian paling bawah ke bagian **Metafields**.
3. Pada field **Size Chart (`custom.size_chart`)**, pilih size chart khusus produk tersebut.
4. Klik **Save**. Produk ini akan menggunakan size chart miliknya sendiri.

---

## 🧪 Logika Pengujian 4 Skenario (Fallback Matrix)

| Skenario | Kondisi Produk | Hasil yang Diharapkan |
|---|---|---|
| **Skenario 1** | Produk memiliki `custom.size_chart` sendiri | Tombol **SIZE GUIDE** tampil dan menampilkan data size chart khusus milik produk. |
| **Skenario 2** | Produk tidak memiliki `custom.size_chart`, tetapi koleksinya memiliki `custom.default_size_chart` | Tombol **SIZE GUIDE** tampil dan menampilkan data size chart default dari koleksinya. |
| **Skenario 3** | Produk tidak memiliki metafield, dan koleksinya juga tidak memiliki size chart | Tombol **SIZE GUIDE** dan modal **sama sekali tidak dirender** di HTML. |
| **Skenario 4** | Produk non-pakaian (misalnya Aksesoris / Tote Bag) | Tombol **SIZE GUIDE** dan modal **sama sekali tidak dirender** di HTML. |

---

## ♿ Fitur Aksesibilitas & Interaktivitas

- **HTML5 `<dialog>`**: Menggunakan elemen dialog semantik dengan atribut `aria-modal="true"` dan `aria-labelledby`.
- **Keyboard Trapping & ESC**: Saat modal terbuka, pengguna dapat menekan tombol `ESC` untuk menutup, dan tombol `Tab` hanya akan bergulir di antara elemen interaktif di dalam modal.
- **Restorasi Fokus**: Saat modal ditutup, fokus kursor secara otomatis kembali ke tombol pembuka (trigger button).
- **Body Scroll Lock**: Saat modal terbuka, halaman di belakang terkunci dan tidak dapat di-scroll.
- **Sticky Column di Mobile**: Pada resolusi layar kecil (≤ 375px), tabel memiliki fitur horizontal scrolling dengan kolom pertama (Ukuran) tetap terpancang (*sticky*) sehingga pengguna tidak bingung mencocokkan baris ukuran.

---

## 🌟 Fitur Bonus (Nilai Tambah)

1. **Rekomendasi Ukuran Interaktif (Size Recommender)**:
   - Pengunjung dapat memasukkan ukuran lingkar dada (cm) mereka di kolom pencarian ukuran.
   - Sistem akan mencari baris ukuran terdekat yang paling pas, menyorot (*highlight*) baris tersebut di dalam tabel secara visual, dan memberikan notifikasi ukuran yang disarankan.
2. **Dukungan Dwibahasa (Indonesian & English)**:
   - Terintegrasi penuh dengan sistem lokalisasi Shopify. Mendukung bahasa Indonesia (`id`) dan bahasa Inggris (`en`) tanpa teks hardcode.

---

## 🛠️ Verifikasi Theme Check & Alur Developer

Untuk memverifikasi kualitas tema:
```bash
# Menjalankan linter Theme Check
shopify theme check

# Menjalankan local development server
npm run dev
# atau
shopify theme dev --store ridho-playground.myshopify.com --theme 144753360980 --port 3000
```
Hasil `shopify theme check`: **0 Error**.
Semua perubahan dikomit secara bertahap menggunakan Git dengan format pesan commit konvensional (*Conventional Commits*).
