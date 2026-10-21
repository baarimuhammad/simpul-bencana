# Sumber dan keputusan atribusi

## Laporan utama

Seluruh 169 baris lampiran teks `Pasted text(4).txt` dibaca sebelum perancangan: daftar isi, Bab 1–3 dan daftar pustaka. Isi biodata/lampiran pribadi tidak terdapat pada teks yang tersedia, dan tidak disalin ke aplikasi. Roadmap utama mengikuti Bab 2.4, bukan versi berbeda Bab 3.2. Data operasional proyek dibuat ulang secara sintetis, bukan diekstrak sebagai data pengamatan dari laporan.

Angka <65%, <3 jam, 3.176 kejadian, 99,02%, Rp68,67 triliun dan angka IDRIP pada laporan tidak dipakai untuk KPI aplikasi. Halaman Tentang mengarahkan ke rujukan proposal, dengan catatan bahwa klaim ilmiahnya perlu diverifikasi terpisah.

## Rujukan teknis primer

- Netlify Functions, Request/Response dan entrypoint `.mts`: https://docs.netlify.com/build/functions/get-started/
- Konfigurasi Functions dan custom path: https://docs.netlify.com/build/functions/configuration/
- Konfigurasi build dan node bundler: https://docs.netlify.com/build/configure-builds/file-based-configuration/
- Netlify CLI, build/deploy Functions: https://cli.netlify.com/commands/functions/ dan https://cli.netlify.com/commands/deploy/
- OASIS CAP 1.2: https://docs.oasis-open.org/emergency/cap/v1.2/CAP-v1.2-os.pdf
- Empat prinsip Satu Data Indonesia, Perpres 39/2019: https://peraturan.bpk.go.id/Details/108813/perpres-no-39-tahun-2019

Kontrak katalog dan alur interoperabilitas adalah usulan ilustratif; tidak menyatakan kepatuhan terverifikasi terhadap regulasi, kontrak data instansi, atau profil CAP nasional.

## Peta dasar

`public/data/archipelago.geojson` dibuat dari paket **world-atlas 2.0.2**, file `countries-50m.json` (Natural Earth, skala 1:50 juta), dikonversi memakai **topojson-client 3.1.0**. Hanya Indonesia dan beberapa negara sekitar yang disertakan; koordinat dibulatkan tiga desimal. File lokal sekitar 176 KB sebelum kompresi jaringan.

Natural Earth menyatakan data peta public domain: https://www.naturalearthdata.com/about/terms-of-use/

Peta ini bukan peta administrasi resmi Indonesia/BIG. Marker DAS, area layer, batas cakupan, titik dan rute evakuasi pada prototipe bersifat ilustratif dan tidak dapat dipakai untuk navigasi. Tidak ada tile eksternal atau API key. Skrip pembuat peta dapat diulang setelah `npm ci`:

```bash
node scripts/prepare-map.mjs
```

## Aset dan lisensi paket

Lambang SIMPUL menggunakan bentuk generik Layers/Network dan favicon SVG sederhana; tidak ada logo resmi kementerian, BNPB, BMKG atau Garuda. Ikon Lucide, font sistem perangkat. Lisensi paket mengikuti metadata tiap dependensi pada lockfile (React/Vite/TypeScript/Netlify tools/jsPDF/Lucide dan dependensi transitif). Tidak ada foto atau aset AI yang disertakan.
