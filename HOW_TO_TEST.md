# 🧪 Guide Testing di Laptop Lain (Dev Branch)

Berikut adalah panduan untuk menjalankan update terbaru (Manage Categories) di laptop lain.

## 1. Persiapan (Pull Code)

Pastikan Anda sudah berada di branch `dev` dan tarik kode terbaru:

```bash
git checkout dev
git pull origin dev
```

## 2. Setup Backend

Karena file `.env` (berisi password database) tidak ikut ter-upload ke Git demi keamanan, Anda perlu membuatnya manual.

1.  Masuk ke folder Backend:
    ```bash
    cd Backend
    npm install
    ```
2.  Duplicate file `.env.example` menjadi `.env`.
3.  Isi kredensial Database **TiDB Dev** (sama seperti di laptop ini):

    ```ini
    DB_HOST=gateway01.ap-southeast-1.prod.aws.tidbcloud.com
    DB_USER=2beiFEbYGwBxT4a.root
    DB_PASSWORD=AQCE6wc0olpfDcny
    DB_NAME=keuangan_dev
    DB_PORT=4000
    DB_SSL=true
    JWT_SECRET=dev-secret-key-123
    ```

    _(Note: Database ini ada di cloud, jadi data kategori yang sudah kita seed akan otomatis muncul di laptop mana saja asal connect ke database yang sama!)_

4.  Jalankan server:
    ```bash
    npm start
    ```
    _Pastikan muncul: "Server berjalan di http://localhost:5000" & "Connected to database"_

## 3. Setup Frontend

1.  Buka terminal baru, masuk ke folder Frontend:
    ```bash
    cd Frontend
    npm install
    ```
2.  Jalankan aplikasi:
    ```bash
    npm run dev
    ```

## 4. Cara Testing Fitur Baru

1.  Buka menu **Sidebar -> Categories**.
2.  Coba **Tambah Group** baru di tab Expense.
3.  Coba **Tambah Kategori** baru di dalam group tersebut.
4.  Buka menu **Add Transaction**.
5.  Pilih Type "Expense", dan pilih Main Category/Sub Category yang baru saja Anda buat.
6.  Simpan transaksi.

✅ Jika semua lancar, berarti sinkronisasi berhasil.
