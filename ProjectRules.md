# Project Rules (Structured)

Dokumen ini adalah pedoman implementasi aplikasi agar konsisten antar modul, mudah dirawat, dan mudah direuse.

## 1) Prinsip Umum

- Gunakan **Next.js App Router** dengan pendekatan **Server Component First**.
- Seluruh UI ditulis dalam **Bahasa Indonesia**.
- Semua mutasi data wajib melalui **Server Actions**.
- Semua form wajib divalidasi dengan **Zod**.
- Terapkan **Soft Delete** menggunakan kolom `deletedAt`.
- Untuk kolom unik pada data yang dihapus (misalnya `email`, `phone`), ubah nilainya saat soft delete dengan format:
  - `[value]-[timestamp]-deleted`

## 2) Arsitektur Folder

- `src/app`:
  - Routing, page, layout, API route.
  - `page.tsx` wajib Server Component.
  - Jika butuh interaksi tinggi, buat `client.tsx`.
- `src/actions`:
  - Semua server action per entitas (`user.ts`, `menu.ts`, `material.ts`, dst).
- `src/components/ui`:
  - Komponen dasar Shadcn/UI primitives.
- `src/components`:
  - Komponen custom fitur.
- `src/constants`:
  - `env.ts`: re-export environment variables.
  - `constants.ts`: konstanta statis aplikasi.
- `src/lib`:
  - Utility lintas fitur (`prisma`, auth, query, formatter, uploader helper).

## 3) Routing Konvensi

### Root & Auth

- `/`:
  - Cek sesi login.
  - Belum login -> redirect `/auth/login`.
  - Sudah login -> redirect `/dashboard`.
- `/auth`:
  - Jika belum ada user sama sekali -> redirect `/auth/first-time-setup`.
  - Jika sudah ada user -> redirect `/auth/login`.
- `/auth/login`: login utama.
- `/auth/first-time-setup`: setup user pertama.

### Dashboard

- Semua route `dashboard/*` wajib diproteksi guard sesi.
- Navigasi dashboard mengikuti `DASHBOARD_NAVIGATION` di `src/constants/constants.ts`.

## 4) Standard Auth & Session

- Password hashing/verification wajib pakai `bcryptjs`.
- Session cookie:
  - HttpOnly.
  - SameSite `lax`.
  - `secure` hanya di production.
- Session helper dan parser ditempatkan di `src/lib/auth.ts`.

## 5) Standard Form & Validation

- Form stack wajib:
  - `react-hook-form`
  - `@hookform/resolvers/zod`
  - Komponen `Form` dari `src/components/ui/form.tsx`
- Pola schema:
  - Schema zod ditempatkan dekat fitur form (contoh: `src/components/menu/menu-form-schema.ts`).
  - Input optional string dari form sebaiknya menerima `""` dan di-transform ke `undefined` bila diperlukan.
- Error handling:
  - Validasi gagal harus mengembalikan message yang jelas untuk user.

## 6) Standard Data Fetching & Mutation

- Fetching data dilakukan dari server (Server Component atau Server Action).
- Mutation hanya lewat Server Action.
- Setelah mutate, wajib `revalidatePath` untuk path terkait.
- Gunakan tipe return action yang eksplisit. Contoh pola:
  - `{ success: boolean, message: string, data?: T }`

## 7) Business Rules Domain

### Menu & Recipe (BOM)

- `Menu` dan `Material` adalah entitas berbeda.
- Satu menu harus memiliki recipe (komposisi material per porsi).
- Variasi ukuran cup dibuat sebagai entitas menu terpisah.

### Order & POS

- `OrderItem` wajib relasi many-to-one ke `Order`.
- Saat order terjual, stok material berkurang sesuai recipe.
- Pengurangan stok dicatat ke `MaterialTransaction` tipe `SELL`.
- `recordedBuyPrice` pada `OrderItem`/`Order` wajib snapshot saat transaksi.

### Inventory

- Semua mutasi stok wajib tercatat di `MaterialTransaction`.
- `MaterialPurchaseItem` berelasi one-to-one dengan `MaterialTransaction` tipe `PURCHASE`.
- Wajib ada 1 fungsi util terpusat untuk refresh:
  - `recordedAmount`
  - `recordedBuyPrice`
- Fungsi refresh dipanggil di semua action yang memengaruhi stok.

## 8) Standard Image Upload

- Gunakan Cloudinary melalui API route internal.
- Endpoint standar: `/api/image-upload`.
- Flow upload:
  - Hitung hash file (`sha256`).
  - Cek tabel `Image` berdasarkan hash.
  - Jika sudah ada, return URL existing (dedup).
  - Jika belum ada, upload ke Cloudinary, simpan hash+url ke `Image`, lalu return URL.
- Komponen uploader harus reusable dan menerima props:
  - value URL saat ini
  - callback update nilai form
  - callback loading state

## 9) Reusable Components (Wajib Diprioritaskan)

### Reusable untuk List Data

- `src/components/data-table/query-controls.tsx`
  - Untuk search, sort, order, page size.
- `src/components/data-table/query-pagination.tsx`
  - Untuk pagination berbasis querystring.
- `src/lib/query-string.ts`
  - Builder query string yang konsisten lintas halaman.

### Reusable untuk Image

- `src/components/shared/image-uploader.tsx`
  - Upload image reusable untuk Menu, Material, Customer, dsb.

### Reusable untuk Form Menu/Recipe

- `src/components/menu/menu-editor-form.tsx`
  - Dipakai untuk mode create dan edit.
- `src/components/menu/menu-form-schema.ts`
  - Single source of truth schema menu + quick material.

## 10) Konvensi Penulisan Kode

- Gunakan TypeScript strict.
- Nama file:
  - kebanyakan pakai `kebab-case` untuk komponen/utility file.
- Penamaan action:
  - Verb + Entity + `Action` (misal `getMenuListAction`, `createMenuWithRecipesAction`).
- Penamaan type:
  - `EntityResult`, `EntityMutationResult`, `EntityOption`.
- Hindari duplikasi logic:
  - Query parsing, formatter, uploader, pagination dipindah ke reusable util/component.

## 11) Checklist Implementasi Modul Baru

- Tambahkan route dashboard + update navigation constant.
- Buat schema zod untuk semua form.
- Buat server actions untuk get/list/detail/create/update/delete(soft delete).
- Buat list page dengan:
  - search
  - sorting
  - ordering
  - pagination
- Jika ada media, gunakan `ImageUploader` + `/api/image-upload`.
- Tambahkan revalidate path yang relevan.
- Pastikan guard auth bekerja pada route dashboard.
- Jalankan minimal:
  - `npx tsc --noEmit`
  - `eslint` untuk file yang diubah

## 12) Catatan Integrasi

- `next.config.ts` harus mengizinkan domain image eksternal yang dipakai (contoh Cloudinary).
- Semua environment baru wajib didaftarkan di `src/constants/env.ts`.
- Hindari akses `process.env` langsung di banyak file; gunakan `env` constant.

## 13) Lampiran: Dokumen Rules Sebelumnya

Bagian ini mempertahankan konteks dokumen lama, tetapi tidak dijadikan sumber utama agar tidak duplikatif.

### Ringkasan Rules Lama

- General & Soft Delete:
  - Soft delete via `deletedAt`.
  - Penyesuaian nilai unique field saat delete: `[value]-[timestamp]-deleted`.
  - Form wajib Zod.
  - Mutasi wajib Server Actions.
- Menu & Recipe:
  - `Menu` dan `Material` entitas terpisah.
  - Tiap menu memiliki recipe per porsi.
  - Variasi cup size dipisah sebagai menu berbeda.
- Order & POS:
  - `OrderItem` many-to-one ke `Order`.
  - Penjualan memotong stok material via recipe.
  - Catat ke `MaterialTransaction` tipe `SELL`.
  - `recordedBuyPrice` pada order wajib snapshot.
- Inventory:
  - Semua mutasi stok dicatat di ledger `MaterialTransaction`.
  - `MaterialPurchaseItem` one-to-one ke transaction tipe `PURCHASE`.
  - Wajib fungsi refresh stok dan modal rata-rata terpusat.
- Routing:
  - Root/Auth, Dashboard, Inventory, Sales/Report sesuai daftar route pada versi lama.
- Architecture:
  - Folder `src`, Shadcn di `src/components/ui`, custom di `src/components`.
  - Re-export env di `src/constants/env.ts`.
  - Konstanta di `src/constants/constants.ts`.
  - Server Component First + client split bila perlu.
  - Grouping actions per entitas di `src/actions`.
  - Password security dengan `bcryptjs`.

## Tambahan

# Business Rules

**General & Soft Delete**

- Implementasikan mekanisme Soft Delete dengan mengisi kolom `deletedAt`.
- Ubah nilai kolom _unique_ (seperti `email` pada User atau `phone` pada Customer) saat dihapus dengan format: `[value]-[timestamp]-deleted` untuk mencegah bentrok data jika ada pendaftaran baru.
- Semua form wajib menggunakan Zod untuk validasi skema.
- Semua mutasi database harus menggunakan arsitektur Server Actions.

**Menu & Recipe (BOM)**

- Produk akhir (Menu) dan bahan baku (Material) adalah entitas yang terpisah.
- Setiap Menu memiliki Recipe yang menjabarkan Material apa saja dan berapa jumlah yang dibutuhkan untuk membuat 1 porsi.
- Perbedaan ukuran _cup_ (misal: Regular, Large) dibuat sebagai entitas Menu yang berbeda.

**Order & Point of Sales**

- Entitas `OrderItem` wajib memiliki relasi _Many-to-One_ kembali ke `Order`.
- Setiap 1 qty `OrderItem` yang terjual wajib memicu pengurangan stok bahan baku sesuai dengan Recipe terkait.
- Pengurangan stok tersebut dicatat otomatis ke dalam tabel `MaterialTransaction` dengan tipe SELL.
- Nilai `recordedBuyPrice` pada `OrderItem` dan `Order` harus dikunci (_snapshot_) pada saat transaksi terjadi untuk kalkulasi _profit_ (Total - recordedBuyPrice).

**Inventory & Material Management**

- Setiap mutasi stok (masuk, keluar, penyesuaian) wajib dicatat dalam tabel `MaterialTransaction` sebagai buku besar (_ledger_).
- Transaksi pembelian dari `MaterialPurchaseItem` berelasi _One-to-One_ dengan `MaterialTransaction` bertipe PURCHASE.
- **Wajib buat satu fungsi utilitas terpusat (centralized function) untuk menghitung ulang (refresh) sisa stok dan harga beli rata-rata (modal) untuk Material dan Menu.**
- Rumus harga beli material dikalkulasi berdasarkan total nilai stok yang masih tersedia (setelah dikurangi mutasi penjualan dan _adjustment_).
- Panggil fungsi utilitas ini pada setiap _Server Action_ yang memicu mutasi stok (seperti saat input pembelian material baru, _checkout_ pesanan, atau penyesuaian manual) agar nilai `recordedAmount` dan `recordedBuyPrice` di tabel `Material` selalu _up-to-date_.

# Routing Nextjs (App Router)

**Root & Auth**

- `/` : Pengecekan sesi pengguna. Redirect ke `/auth/login` jika belum ada sesi.
- `/auth` : Pengecekan inisialisasi aplikasi. Redirect ke `/auth/first-time-setup` jika tidak ada user sama sekali di database.
- `/auth/login` : Halaman login utama.
- `/auth/first-time-setup` : Halaman pembuatan akun pertama kali.

**Dashboard & Master Data**

- `/dashboard` : Halaman beranda ringkasan sistem.
- `/dashboard/menu` : Halaman daftar menu dan pengaturan resep.
- `/dashboard/customer` : Halaman daftar pelanggan.
- `/dashboard/user` : Halaman manajemen daftar pengguna sistem.
- `/dashboard/account` : Pengaturan akun mandiri untuk pengguna yang sedang login.

**Inventory Management**

- `/dashboard/material` : Halaman daftar bahan baku.
- `/dashboard/material/transaction` : Halaman riwayat mutasi stok bahan baku secara keseluruhan.
- `/dashboard/material/purchase` : Halaman daftar pembelian bahan baku. Memiliki tombol 'Plus' untuk membuka modal tambah pembelian.
- `/dashboard/material/adjustment` : Halaman daftar penyesuaian stok. Memiliki tombol 'Plus' untuk membuka modal tambah penyesuaian.

**Sales & Report**

- `/dashboard/order` : Halaman riwayat seluruh pesanan dari POS.
- `/dashboard/order/point-of-sales` : Antarmuka utama mesin kasir (POS) untuk membuat pesanan baru.
- `/dashboard/report` : Dasbor analitik yang mencakup laporan penjualan, pemakaian bahan baku, keuntungan, dan laporan sisa stok.

# Directory Structure & Architecture

**Folder & Components**

- Gunakan folder `src` sebagai direktori utama aplikasi Next.js.
- Antarmuka pengguna wajib ditulis dalam Bahasa Indonesia.
- Letakkan seluruh komponen dari Shadcn UI di dalam direktori `src/components/ui/`.
- Letakkan komponen UI _custom_ lainnya di dalam direktori `src/components/`.

**Environment & Constants**

- Lakukan _re-export_ seluruh _environment variables_ (seperti `process.env`) secara terpusat di dalam _file_ `./src/constants/env.ts`.
- Simpan seluruh nilai konstan statis lainnya yang digunakan dalam aplikasi di dalam _file_ `./src/constants/constants.ts`.

**Pages & Rendering**

- Terapkan pendekatan _Server Component First_. File `page.tsx` (contoh: `src/app/auth/login/page.tsx`) wajib menjadi Server Component.
- Buat file terpisah (contoh: `src/app/auth/login/client.tsx`) jika halaman tersebut sangat membutuhkan interaktivitas (Client Component).
- Seluruh form wajib menggunakan komponen Form dari Shadcn, _hooks_ `useForm` dari React Hook Form, dan validasi Zod.

**Data Fetching & Mutations**

- Gunakan arsitektur Server Actions murni untuk proses ambil data (_get_) maupun mutasi data (_mutate_).
- Kelompokkan file Server Actions berdasarkan entitas di dalam direktori `src/actions/` (contoh: `user.ts`, `material.ts`, `order.ts`, `customer.ts`).

**Security**

- Proses enkripsi dan verifikasi kata sandi wajib menggunakan _library_ `bcryptjs`.
