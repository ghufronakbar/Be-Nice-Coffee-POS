# Ringkasan Hasil dan Pembahasan Sistem Be Nice Coffee

## 1. Gambaran Umum Sistem

Sistem Be Nice Coffee merupakan aplikasi berbasis web yang dikembangkan untuk mendukung operasional coffee shop, terutama pada proses pengelolaan menu, resep, bahan baku, transaksi penjualan, pembelian material, penyesuaian stok, customer, user, dan laporan bisnis. Aplikasi ini dirancang sebagai sistem internal yang digunakan oleh pemilik, admin, kasir, maupun staf inventory sesuai hak akses masing-masing.

Permasalahan utama yang diselesaikan oleh sistem ini adalah kebutuhan pencatatan operasional yang saling terhubung. Pada operasional coffee shop, transaksi penjualan tidak hanya menghasilkan data order, tetapi juga memengaruhi stok bahan baku berdasarkan resep menu yang dijual. Oleh karena itu, sistem ini tidak hanya berperan sebagai Point of Sales, tetapi juga sebagai sistem inventory berbasis recipe/BOM (Bill of Materials), sehingga stok material dapat diperbarui secara otomatis ketika terjadi transaksi.

Secara umum, sistem memiliki beberapa fokus utama:

- Mengelola data menu dan resep bahan baku per menu.
- Mengelola data material sebagai bahan baku.
- Mengelola pembelian material dan menghitung harga beli rata-rata.
- Mencatat seluruh mutasi stok material dalam buku besar transaksi material.
- Melakukan transaksi penjualan melalui halaman Point of Sales.
- Menghasilkan riwayat order, laporan penjualan, profit, pembelian, dan inventory.
- Mengatur user dan hak akses secara dinamis berdasarkan kebutuhan halaman.
- Menyediakan dashboard ringkasan untuk memantau kondisi operasional.

## 2. Teknologi yang Digunakan

Aplikasi dikembangkan menggunakan Next.js App Router dengan pendekatan Server Component First. Pendekatan ini dipilih karena sebagian besar halaman membutuhkan data dari server dan hanya beberapa bagian tertentu yang memerlukan interaksi client-side, seperti modal form, POS, toast notification, uploader gambar, dan grafik.

Teknologi utama yang digunakan adalah:

- Next.js App Router sebagai framework utama.
- React untuk pembuatan antarmuka.
- TypeScript untuk menjaga konsistensi tipe data.
- Prisma ORM sebagai penghubung aplikasi dengan database PostgreSQL.
- Zod untuk validasi form dan input.
- React Hook Form untuk pengelolaan form interaktif.
- bcryptjs untuk hashing dan verifikasi password.
- Cloudinary untuk penyimpanan gambar menu dan material.
- Recharts untuk visualisasi data pada dashboard dan laporan.
- Shadcn/UI dan komponen UI custom untuk membangun antarmuka.

Pemilihan Server Actions sebagai jalur utama mutasi data membuat proses perubahan data lebih terstruktur. Setiap operasi seperti membuat menu, melakukan checkout order, menambah pembelian material, mengubah customer, hingga reset password user dilakukan melalui action yang terpisah berdasarkan domain fitur.

## 3. Arsitektur Sistem

Struktur aplikasi dibagi berdasarkan tanggung jawab masing-masing folder. Folder `src/app` digunakan untuk routing, layout, page, dan API route. Folder `src/actions` digunakan untuk menyimpan Server Actions berdasarkan domain, seperti `menu.ts`, `material.ts`, `order.ts`, `customer.ts`, `user.ts`, dan `analytics.ts`. Folder `src/components` digunakan untuk menyimpan komponen fitur, sedangkan `src/components/ui` berisi komponen dasar UI.

Beberapa utility lintas fitur ditempatkan di folder `src/lib`, antara lain:

- `auth.ts` untuk session dan autentikasi.
- `authorization.ts` untuk guard akses halaman dashboard.
- `access-control.ts` untuk daftar hak akses, grouping access, dan redirect landing berdasarkan access.
- `inventory.ts` untuk refresh stok dan harga beli material.
- `format.ts` untuk format rupiah dan tanggal.
- `query-string.ts` untuk reusable query string pada list page.

Dengan pembagian tersebut, sistem menjadi lebih mudah dikembangkan karena setiap domain fitur memiliki action, schema, komponen, dan page yang jelas.

## 4. Desain Database dan Relasi Utama

Database dirancang untuk mendukung proses operasional coffee shop yang saling terhubung. Model utama yang digunakan adalah:

- `User` untuk akun pengguna dan hak akses.
- `Customer` untuk data pelanggan.
- `Menu` untuk produk yang dijual.
- `Recipe` untuk komposisi material per menu.
- `Material` untuk bahan baku.
- `MaterialTransaction` untuk ledger stok material.
- `MaterialPurchase` dan `MaterialPurchaseItem` untuk pembelian bahan baku.
- `Order` dan `OrderItem` untuk transaksi penjualan.
- `Image` untuk penyimpanan hash dan URL gambar hasil upload.

Relasi terpenting dalam sistem adalah relasi antara `Menu`, `Recipe`, dan `Material`. Setiap menu memiliki satu atau lebih recipe, dan setiap recipe menentukan material serta jumlah yang dibutuhkan untuk membuat satu porsi menu. Ketika order dibuat, sistem membaca recipe dari menu yang dipesan, lalu membuat transaksi material bertipe `SELL` untuk mengurangi stok material.

Model `MaterialTransaction` digunakan sebagai buku besar mutasi stok. Setiap stok masuk dari pembelian dicatat sebagai `PURCHASE`, stok keluar dari penjualan dicatat sebagai `SELL`, dan koreksi manual dicatat sebagai `ADJUSTMENT`. Pendekatan ledger ini membuat riwayat stok lebih transparan karena setiap perubahan stok memiliki catatan transaksi.

Sistem juga menerapkan soft delete dengan kolom `deletedAt`. Data yang dihapus tidak langsung dihilangkan dari database, melainkan ditandai sebagai terhapus. Untuk field unik seperti email user dan nomor customer, nilainya diubah ketika soft delete agar tidak bentrok dengan data baru.

## 5. Modul Autentikasi dan Hak Akses

Sistem memiliki alur autentikasi yang terdiri dari first time setup, login, session, dan logout. Jika belum ada user, aplikasi mengarahkan pengguna ke halaman first time setup. User pertama yang dibuat akan otomatis menjadi superadmin (`isSuperAdmin = true`).

Session disimpan menggunakan cookie HttpOnly dengan signature HMAC. Hal ini membuat session tidak dapat diakses langsung dari JavaScript client dan membantu mengurangi risiko manipulasi session.

Hak akses dibuat secara dinamis berdasarkan halaman. Field access yang tersedia meliputi:

- Akses dashboard overview.
- Akses baca dan tulis menu.
- Akses baca dan tulis material.
- Akses baca dan tulis customer.
- Akses baca user.
- Akses transaksi material.
- Akses pembelian material.
- Akses penyesuaian material.
- Akses order.
- Akses Point of Sales.
- Akses laporan.

Superadmin selalu dianggap memiliki semua hak akses walaupun nilai access di database bernilai false. Hal ini dilakukan agar superadmin tidak kehilangan akses akibat kesalahan konfigurasi database.

Ketika user login, sistem tidak selalu mengarahkan ke `/dashboard`. Sistem mengecek prioritas access. Jika user memiliki `accessOverviewRead`, maka diarahkan ke dashboard. Jika tidak, sistem mencari halaman lain yang sesuai dengan access user, misalnya POS, order, menu, material, atau report. Jika user tidak memiliki access ke halaman mana pun, maka fallback diarahkan ke `/dashboard/account`.

Sidebar dashboard juga difilter berdasarkan access user. Dengan demikian, user hanya melihat menu navigasi yang memang dapat diakses.

## 6. Modul Dashboard

Halaman dashboard digunakan untuk menampilkan ringkasan operasional. Informasi yang ditampilkan meliputi:

- Jumlah order hari ini.
- Omzet hari ini.
- Profit hari ini.
- Jumlah order pending.
- Tren penjualan tujuh hari terakhir.
- Alert stok rendah atau habis.
- Menu yang belum memiliki resep.
- Aktivitas order terbaru.
- Transaksi material terbaru.
- Pembelian material terbaru.

Dashboard juga menyediakan shortcut menuju fitur penting seperti POS, pembelian material, adjustment stok, dan order pending. Shortcut tersebut disesuaikan dengan hak akses user sehingga user tidak diarahkan ke halaman yang tidak dapat diakses.

Pembahasan dari modul dashboard menunjukkan bahwa dashboard bukan hanya tampilan ringkasan, tetapi juga menjadi pusat navigasi cepat untuk aktivitas operasional harian.

## 7. Modul Menu dan Resep

Modul menu digunakan untuk mengelola produk yang dijual oleh Be Nice Coffee. Setiap menu memiliki harga, gambar opsional, dan resep. Resep mendefinisikan bahan baku yang digunakan untuk membuat satu porsi menu.

Data menu disesuaikan dengan daftar menu aktual pada `Menu.md`, yaitu:

- Butterscotch Coffe Latte.
- Salted Caramel Latte.
- Choco Caramelo.
- Crunchy Choco Crumb.
- Vanilla Latte.
- Matcha Signature.
- Silky Taro.
- Black Coffee Hot.
- Black Coffee Ice.
- Kopi Susu Gula Aren Hot.
- Kopi Susu Gula Aren Ice.

Fitur yang tersedia pada modul menu:

- Menampilkan list menu dengan search, sorting, ordering, dan pagination.
- Menampilkan detail menu.
- Membuat menu baru beserta resep.
- Mengubah menu dan resep.
- Menambahkan material baru langsung dari form menu agar pengguna tidak perlu berpindah halaman.
- Upload gambar menu melalui uploader reusable.

Pembahasan penting pada modul ini adalah penggunaan recipe sebagai dasar perhitungan stok dan modal. Dengan adanya recipe, sistem dapat menghitung pemakaian material secara otomatis ketika terjadi order.

## 8. Modul Material

Modul material digunakan untuk mengelola bahan baku seperti beans, susu, syrup, powder, cup, dan lid. Setiap material memiliki satuan, yaitu gram, mililiter, atau pcs.

Fitur yang tersedia:

- Menampilkan list material dengan filter, sorting, ordering, dan pagination.
- Menambahkan material baru menggunakan modal.
- Mengubah material menggunakan modal.
- Menghapus material menggunakan soft delete.
- Melihat detail material.
- Melihat menu apa saja yang menggunakan material tersebut.
- Melihat riwayat transaksi material yang berhubungan dengan material.
- Upload gambar material secara opsional.

Pada awalnya terdapat kendala ketika material disimpan tanpa gambar, karena input gambar menghasilkan nilai undefined. Kendala ini diselesaikan agar gambar bersifat opsional dan material tetap dapat disimpan tanpa image URL.

Pembahasan modul material menunjukkan bahwa material tidak hanya menjadi data master, tetapi juga menjadi dasar perhitungan stok dan profit.

## 9. Modul Pembelian Material

Modul pembelian material digunakan untuk mencatat stok masuk dari supplier. Pembelian dibuat berdasarkan invoice dan berisi beberapa item material.

Fitur yang tersedia:

- List pembelian material dengan search, sorting, ordering, dan pagination.
- Membuat pembelian material melalui halaman `/dashboard/material/purchase/create`.
- Mengisi pembelian berdasarkan amount dan total, bukan amount dan harga satuan, agar lebih sesuai dengan cara input pengguna. Contohnya pengguna dapat memasukkan “10000 ml harganya Rp 10000”.
- Detail pembelian material.
- Edit item pembelian.
- Delete pembelian.

Saat pembelian material dibuat, sistem secara otomatis:

- Membuat `MaterialPurchase`.
- Membuat `MaterialPurchaseItem`.
- Membuat `MaterialTransaction` bertipe `PURCHASE`.
- Menghitung ulang `recordedAmount` dan `recordedBuyPrice` material.

Perhitungan menggunakan `Prisma.Decimal` untuk mengurangi risiko kesalahan kalkulasi angka desimal.

## 10. Modul Transaksi Material dan Adjustment

Seluruh perubahan stok dicatat pada `MaterialTransaction`. Tipe transaksi terdiri dari:

- `PURCHASE` untuk stok masuk dari pembelian.
- `SELL` untuk stok keluar karena order.
- `ADJUSTMENT` untuk penyesuaian stok manual.

Halaman transaksi material menyediakan:

- List seluruh transaksi material.
- Filter berdasarkan tipe transaksi.
- Search, sorting, ordering, dan pagination.
- Modal detail transaksi.
- Relasi ke purchase atau order apabila transaksi berasal dari pembelian atau penjualan.

Halaman adjustment digunakan untuk mencatat koreksi manual stok. Adjustment dapat bernilai positif atau negatif. Misalnya, jika terdapat bahan rusak atau cup hilang, adjustment bernilai negatif. Jika terdapat bonus supplier, adjustment bernilai positif.

Pembahasan penting pada modul ini adalah konsistensi tanda plus dan minus. Pada laporan, nilai adjustment negatif harus tetap ditampilkan negatif. Kesalahan penggunaan nilai absolut pada summary transaksi material telah diperbaiki agar `ADJUSTMENT -960` tidak berubah menjadi `960`.

## 11. Modul Customer

Modul customer digunakan untuk mengelola data pelanggan. Nomor customer divalidasi agar diawali angka 0, bukan 62 atau format lain. Hal ini menjaga konsistensi data nomor telepon di sistem.

Fitur yang tersedia:

- List customer dengan filter, sorting, ordering, dan pagination.
- Tambah customer melalui modal.
- Detail customer.
- Edit customer.
- Delete customer dengan soft delete.
- Ringkasan aktivitas customer.
- Riwayat order customer.

Halaman detail customer dibuat lebih informatif dengan tampilan ringkasan yang rapi, bukan sekadar teks biasa. Dengan demikian, pengguna dapat melihat kontribusi customer terhadap total order dan profit secara lebih mudah.

## 12. Modul User dan Access Control

Modul user digunakan untuk mengelola pengguna sistem. Aksi tambah user, reset password, dan delete user hanya dapat dilakukan oleh superadmin. Superadmin tidak dapat dihapus.

Fitur modul user:

- List user.
- Tambah user melalui modal.
- Detail user.
- Reset password user ke default `12345678`.
- Delete user non-superadmin.
- Pengaturan hak akses saat membuat user.

Pada form tambah user, hak akses ditampilkan dalam bentuk checkbox. Agar UX lebih baik, checkbox disusun berdasarkan group dan subgroup. Pengguna dapat memilih seluruh group, memilih subgroup tertentu, atau memilih access satu per satu.

Pembahasan pada modul ini menunjukkan bahwa sistem tidak menggunakan role statis seperti “admin” atau “kasir” saja, melainkan menggunakan hak akses per halaman. Pendekatan ini lebih fleksibel karena satu user dapat diberikan kombinasi akses sesuai kebutuhan operasional.

## 13. Modul Account

Halaman account digunakan oleh user yang sedang login untuk mengatur profil pribadi. Data yang dapat diubah adalah nama. Selain itu, tersedia form untuk mengganti password dengan input:

- Password lama.
- Password baru.
- Konfirmasi password baru.

Halaman account juga menjadi fallback ketika user tidak memiliki access ke halaman dashboard lain. Dengan demikian, user tetap memiliki halaman tujuan setelah login walaupun belum diberi akses operasional.

## 14. Modul Order dan Point of Sales

Modul order dibagi menjadi dua bagian utama, yaitu riwayat order dan Point of Sales.

Halaman riwayat order menyediakan:

- List order dengan filter status.
- Search, sorting, ordering, dan pagination.
- Detail order.
- Edit order.
- Delete order.

Setiap edit atau delete order memicu refresh stok yang diperlukan. Ketika order dibatalkan atau dihapus, transaksi material yang berkaitan juga disesuaikan agar stok tetap konsisten.

Halaman Point of Sales dirancang seperti UI kasir. Kasir dapat memilih menu, menentukan jumlah, memilih customer, atau membuat customer baru langsung dari halaman POS. Setelah checkout, order dibuat dengan status `PENDING` dan pengguna diarahkan ke halaman invoice/summary POS.

Pada halaman invoice POS, tersedia CTA:

- `Selesaikan Pesanan` untuk mengubah status menjadi `COMPLETED`.
- `Batalkan Pesanan` untuk mengubah status menjadi `CANCELLED`.

Jika order sudah tidak berstatus `PENDING`, CTA tidak ditampilkan. Edit order setelah transaksi dilakukan melalui halaman detail order biasa.

Pembahasan utama pada modul POS adalah integrasi antara penjualan dan inventory. Setiap order yang dibuat akan:

- Membuat data order.
- Membuat order item.
- Membaca resep menu.
- Membuat transaksi material `SELL`.
- Mengurangi stok material.
- Menyimpan snapshot modal pada order dan order item.

Dengan mekanisme ini, profit dapat dihitung berdasarkan kondisi harga beli pada saat transaksi terjadi.

## 15. Modul Laporan

Modul laporan menyediakan analitik berdasarkan filter tanggal. Data yang ditampilkan meliputi:

- Omzet.
- Profit.
- Modal snapshot.
- Jumlah order.
- Average order value.
- Total pembelian material.
- Jumlah pembelian.
- Nilai stok estimasi.
- Tren penjualan.
- Status order.
- Menu terlaris.
- Pemakaian material.
- Inventory saat ini.
- Ringkasan transaksi material.

Laporan dapat diekspor ke CSV dan PDF. Export CSV tidak menggunakan nama kolom mentah dari database, melainkan label yang sudah diformat dalam Bahasa Indonesia. Nilai seperti rupiah, tanggal, status order, dan satuan material juga diformat agar mudah dibaca.

Export PDF dibuat sebagai format laporan, bukan sekadar print atau screenshot. PDF berisi struktur halaman, header, footer, section, dan tabel. Lebar tabel disesuaikan agar rata dengan area konten, dan posisi judul disesuaikan agar tidak menabrak header.

Pembahasan modul laporan menunjukkan bahwa laporan tidak hanya menampilkan data mentah, tetapi menyajikan informasi dalam bentuk yang lebih siap digunakan untuk evaluasi bisnis.

## 16. Modul Upload Gambar

Sistem menyediakan API route `/api/image-upload` untuk upload gambar ke Cloudinary. Proses upload menerapkan deduplikasi berdasarkan hash file.

Alur upload gambar:

1. File dipilih oleh pengguna.
2. Sistem menghitung hash file menggunakan SHA-256.
3. Sistem mengecek tabel `Image`.
4. Jika hash sudah ada, sistem mengembalikan URL gambar yang sudah tersimpan.
5. Jika hash belum ada, file diupload ke Cloudinary.
6. URL dan hash disimpan ke database.
7. URL dikembalikan ke form.

Pendekatan ini menghindari duplikasi file yang sama dan dapat mempercepat proses ketika file pernah diupload sebelumnya.

## 17. Seeder Data Awal

Sistem memiliki route `/api/seed` untuk menjalankan seed data awal. Route ini tidak langsung melakukan query database, tetapi memanggil action `runSeedAction`. Hal ini mengikuti aturan bahwa mutasi data dilakukan melalui Server Actions.

Seeder dibuat idempotent, sehingga jika data sudah ada maka step akan dilewati (`skipped`) dan tidak membuat duplikasi. Seeder juga memiliki guard: jika jumlah user aktif lebih dari satu, seed data awal dilewati karena sistem dianggap sudah tidak berada pada kondisi awal.

Data seed meliputi:

- Material awal.
- Pembelian material awal.
- Adjustment stok.
- Menu dan resep sesuai `Menu.md`.
- Customer demo.
- Order demo dengan status pending, completed, dan cancelled.

Seeder tidak membuat user karena user pertama dibuat melalui first time setup.

## 18. Reusable Component dan Pola UI

Sistem menggunakan beberapa reusable component untuk menjaga konsistensi:

- `QueryControls` untuk search, sorting, ordering, dan page size.
- `QueryPagination` untuk pagination berbasis query string.
- `ImageUploader` untuk upload gambar reusable.
- `MenuEditorForm` untuk form create dan edit menu.
- Modal form untuk customer, material, dan user.
- Komponen chart dashboard dan report.

Penggunaan reusable component membuat implementasi halaman list menjadi konsisten. Hampir semua halaman master data dan transaksi memiliki pola yang sama, yaitu filter, sorting, ordering, pagination, list, detail, dan action.

## 19. Hasil Implementasi

Berdasarkan implementasi yang telah dilakukan, sistem berhasil menyediakan fitur utama yang dibutuhkan oleh coffee shop:

- Autentikasi user dan first time setup.
- Hak akses dinamis per halaman.
- Dashboard ringkasan operasional.
- Pengelolaan menu dan resep.
- Pengelolaan material.
- Pembelian material.
- Penyesuaian stok.
- Ledger transaksi material.
- Pengelolaan customer.
- Pengelolaan user.
- Pengaturan akun pribadi.
- Point of Sales.
- Riwayat dan detail order.
- Laporan dengan chart, CSV, dan PDF.
- Upload gambar dengan Cloudinary dan deduplikasi hash.
- Seeder data awal.

Sistem juga berhasil menerapkan prinsip penting seperti soft delete, validasi form menggunakan Zod, penggunaan Server Actions, dan refresh stok terpusat setelah transaksi yang memengaruhi inventory.

## 20. Pembahasan

### 20.1 Integrasi Penjualan dan Inventory

Salah satu hasil utama dari sistem ini adalah integrasi antara order dan inventory. Pada sistem kasir sederhana, penjualan biasanya hanya mencatat transaksi uang. Pada sistem ini, setiap penjualan juga memicu pengurangan stok material berdasarkan resep menu. Hal ini membuat data stok lebih relevan dengan kondisi operasional nyata.

### 20.2 Snapshot Modal dan Profit

Sistem menyimpan `recordedBuyPrice` pada order dan order item. Snapshot ini penting karena harga beli material dapat berubah dari waktu ke waktu. Jika profit dihitung langsung dari harga beli material terbaru, maka profit transaksi lama dapat berubah dan menjadi tidak akurat. Dengan snapshot, profit tetap sesuai kondisi saat order dibuat.

### 20.3 Ledger Material Transaction

Penggunaan `MaterialTransaction` sebagai ledger memberikan transparansi terhadap perubahan stok. Setiap stok masuk, stok keluar, dan penyesuaian manual dapat dilacak. Pendekatan ini lebih baik dibanding hanya menyimpan angka stok akhir karena penyebab perubahan stok tetap dapat dianalisis.

### 20.4 Hak Akses Dinamis

Hak akses dinamis membuat sistem lebih fleksibel. User tidak hanya dibedakan berdasarkan satu role, tetapi dapat diberikan akses spesifik sesuai tanggung jawab. Misalnya, kasir dapat diberikan akses POS tanpa akses laporan, sedangkan staf inventory dapat diberikan akses material purchase dan adjustment tanpa akses user management.

### 20.5 Export Laporan

Export laporan dibuat dalam bentuk CSV dan PDF yang sudah diformat. CSV menggunakan label kolom yang mudah dipahami, sedangkan PDF dibuat dengan format laporan. Hal ini meningkatkan kegunaan sistem karena data dapat digunakan untuk dokumentasi, evaluasi, dan kebutuhan administratif.

### 20.6 Kualitas UX

Beberapa keputusan UX dibuat untuk mempercepat pekerjaan pengguna:

- Material dapat dibuat langsung dari form menu.
- Customer dapat dibuat langsung dari POS.
- Add/edit material dan customer menggunakan modal agar tidak perlu berpindah halaman.
- User access dapat dipilih melalui group dan subgroup checkbox.
- Sidebar bersifat collapsible dan responsif untuk mobile.
- Session user dan logout ditempatkan pada area sidebar footer.

## 21. Keterbatasan dan Pengembangan Lanjutan

Walaupun sistem sudah mencakup kebutuhan utama, terdapat beberapa pengembangan lanjutan yang dapat dilakukan:

- Menambahkan audit log untuk semua perubahan penting.
- Menambahkan role template agar konfigurasi access user lebih cepat.
- Menambahkan fitur supplier.
- Menambahkan metode pembayaran dan rekonsiliasi kas.
- Menambahkan laporan per shift atau per kasir.
- Menambahkan low stock threshold per material.
- Menambahkan notifikasi stok minimum.
- Menambahkan export Excel selain CSV.
- Menambahkan unit test dan integration test untuk action kritikal.
- Menambahkan mode multi-outlet jika bisnis berkembang.

## 22. Kesimpulan

Sistem Be Nice Coffee berhasil dibangun sebagai aplikasi operasional coffee shop yang mengintegrasikan penjualan, inventory, menu, resep, customer, user, dan laporan. Sistem ini tidak hanya mencatat transaksi, tetapi juga menghitung dampak transaksi terhadap stok dan profit.

Dari sisi hasil, sistem mampu mendukung aktivitas utama coffee shop mulai dari input menu, pembelian bahan baku, transaksi kasir, pengurangan stok otomatis, hingga pembuatan laporan. Dari sisi pembahasan, pendekatan recipe-based inventory, ledger material transaction, snapshot modal, dan hak akses dinamis menjadi aspek penting yang membedakan sistem ini dari aplikasi pencatatan sederhana.

Dengan fitur yang telah dibuat, sistem dapat digunakan sebagai dasar implementasi digitalisasi operasional Be Nice Coffee dan menjadi bahan pembahasan yang relevan untuk bagian “Hasil dan Pembahasan” dalam penulisan skripsi.
