# Revisi prototipe berdasarkan masukan dosen

Paket ini berisi hanya file yang berbeda dari `simpul-bencana-netlify.zip` sebelumnya. Ekstrak di dalam folder `simpul-bencana` sehingga path `src/`, `server/`, `tests/`, dan `docs/` menimpa file lama. Sebelum mengganti file, simpan salinan perubahan pribadi Anda jika ada.

Alternatif bagi pengguna patch: dari root folder proyek, jalankan `patch -p1 < simpul-bencana-revisi.patch`. Setelah itu jalankan `npm run check`. Patch dan file pengganti menghasilkan versi yang sama; pilih salah satu cara.

## Berkas yang berubah

- `DEMO-SCRIPT.md`
- `README.md`
- `docs/API.md`
- `docs/VERIFICATION.md`
- `server/api.ts`
- `server/openapi.ts`
- `src/lib/store.tsx`
- `src/pages/Ecosystem.tsx`
- `src/pages/Laboratory.tsx`
- `src/pages/Operations.tsx`
- `src/shared/alerts.ts`
- `src/shared/types.ts`
- `src/styles.css`
- `tests/api.test.ts`

Tidak ada dependency baru atau perubahan konfigurasi Netlify. Sesi localStorage v1 direset otomatis ke v2 karena draf lama belum mempunyai snapshot bukti. Seluruh sumber instansi dan kanal masih simulasi; uji browser lengkap pada versi revisi perlu dilakukan sebelum presentasi.
