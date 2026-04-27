# Perpustakaan Privat + Pencarian Publik

Website ini dibuat supaya pengunjung tetap bisa mencari buku, tetapi database Google Sheets tidak dibuka langsung ke publik.

## Cara Kerjanya

Pengunjung hanya membuka `index.html`.

Saat mengetik kata pencarian, website memanggil:

```text
/api/search?q=kata
```

API Vercel membaca Google Sheets privat memakai kunci rahasia yang disimpan di Vercel Environment Variables. Kunci itu tidak dikirim ke browser pengunjung.

## Struktur File

```text
index.html
api/search.js
package.json
vercel.json
README.md
```

## Langkah 1: Buat Google Sheet Jadi Privat

1. Buka Google Sheet database buku.
2. Klik `Share`.
3. Pastikan akses umum bukan `Anyone with the link`.
4. Pilih `Restricted`.
5. Jangan gunakan menu `Publish to web` untuk database yang ingin disembunyikan.

## Langkah 2: Buat Google Cloud Project

1. Buka Google Cloud Console.
2. Buat project baru, misalnya `database-buku`.
3. Masuk ke `APIs & Services`.
4. Aktifkan `Google Sheets API`.

## Langkah 3: Buat Service Account

1. Masuk ke `IAM & Admin`.
2. Pilih `Service Accounts`.
3. Klik `Create service account`.
4. Nama contoh: `vercel-sheets-reader`.
5. Setelah dibuat, buka service account tersebut.
6. Buka tab `Keys`.
7. Klik `Add key`.
8. Pilih `Create new key`.
9. Pilih `JSON`.
10. Simpan file JSON itu baik-baik.

Di dalam file JSON akan ada data seperti ini:

```json
{
  "client_email": "...iam.gserviceaccount.com",
  "private_key": "-----BEGIN PRIVATE KEY-----..."
}
```

## Langkah 4: Share Google Sheet ke Service Account

1. Salin `client_email` dari file JSON.
2. Buka Google Sheet database buku.
3. Klik `Share`.
4. Masukkan email service account tersebut.
5. Beri akses `Viewer`.
6. Klik `Share`.

Ini penting. Kalau Google Sheet tidak di-share ke service account, API Vercel tidak bisa membaca data.

## Langkah 5: Cari Spreadsheet ID

Dari URL Google Sheets seperti ini:

```text
https://docs.google.com/spreadsheets/d/1abcDEFghiJKLmnopQRstuVWxyz/edit
```

Yang disebut `GOOGLE_SHEET_ID` adalah bagian di antara `/d/` dan `/edit`:

```text
1abcDEFghiJKLmnopQRstuVWxyz
```

## Langkah 6: Isi Environment Variables di Vercel

Di dashboard Vercel:

1. Buka project.
2. Masuk ke `Settings`.
3. Pilih `Environment Variables`.
4. Tambahkan variable ini:

```text
GOOGLE_CLIENT_EMAIL
GOOGLE_PRIVATE_KEY
GOOGLE_SHEET_ID
GOOGLE_SHEET_RANGE
```

Isi:

```text
GOOGLE_CLIENT_EMAIL = client_email dari JSON
GOOGLE_PRIVATE_KEY = private_key dari JSON
GOOGLE_SHEET_ID = ID spreadsheet
GOOGLE_SHEET_RANGE = Sheet1!A:E
```

Jika nama tab sheet bukan `Sheet1`, ganti sesuai nama tab. Contoh:

```text
Database!A:E
```

Untuk `GOOGLE_PRIVATE_KEY`, paste seluruh isi private key, termasuk:

```text
-----BEGIN PRIVATE KEY-----
...
-----END PRIVATE KEY-----
```

## Langkah 7: Deploy ke Vercel

1. Upload atau push semua file project ini ke GitHub.
2. Import repo ke Vercel.
3. Framework Preset: `Other`.
4. Build Command: kosongkan/default.
5. Output Directory: kosongkan/default.
6. Deploy.

Setelah mengubah Environment Variables, lakukan deploy ulang.

## Catatan Keamanan

Database asli tidak lagi diambil dari browser.

Tetapi hasil pencarian tetap publik. Supaya data tidak mudah disalin seluruhnya, API ini:

- wajib minimal 3 huruf pencarian,
- hanya mengembalikan maksimal 17 hasil,
- menampilkan 7 data per halaman di browser,
- mendukung filter bidang pencarian: judul, penulis, genre, penerbit, atau tahun,
- tidak menyediakan endpoint untuk mengambil semua buku.

Kalau datanya sangat sensitif, tambahkan login, rate limit, atau pindahkan data ke database yang punya kontrol akses lebih kuat.
