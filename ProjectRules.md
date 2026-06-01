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
