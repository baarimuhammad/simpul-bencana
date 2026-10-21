# SIMPUL BENCANA

Prototipe akademik untuk proposal KIM UNAIR 2026 (GFT): **Sistem Interoperabilitas Multi-Parameter untuk Peringatan Dini Banjir dan Longsor Berbasis Data Silang BMKG–KLHK–BNPB**.

**PROTOTIPE - DATA SIMULASI.** Bukan produk resmi pemerintah, bukan sistem peringatan operasional, dan bukan petunjuk keselamatan. Seluruh pengamatan, populasi, kesiapan, level risiko, metrik, batas DAS, lapisan, rute, dan pengiriman adalah dummy. Peta dasar Natural Earth hanya referensi geografis.

## Menjalankan: satu perintah

Prasyarat: Node.js **22.13+** (disarankan Node 22 LTS) dan npm, tersedia di Windows/macOS/Linux. Ekstrak ZIP lalu buka terminal di folder `simpul-bencana`.

```bash
npm run dev
```

Pada pemakaian pertama perintah ini menjalankan `npm ci` otomatis, kemudian Vite. Buka **http://localhost:5173**. Internet hanya dibutuhkan untuk instalasi paket pertama; aplikasi tidak memakai API eksternal. Seed 2026 tersedia otomatis dalam kode, tanpa database atau migrasi. Pilih **Admin Nasional BNPB** untuk melihat seluruh modul. Tidak ada password.

Jika dependensi sudah terpasang, `npm run dev:vite` langsung menjalankan Vite. API `/api/*` diproses middleware pengembangan dengan handler yang identik dengan Netlify Functions. `npm run preview` hanya untuk pratinjau hasil build statis; gunakan `npm run dev` atau `npx netlify dev` untuk menguji fungsi API secara lokal. Preview statis tetap berfungsi melalui fallback lokal.

## Deploy ke Netlify: satu perintah

Dari folder proyek:

```bash
npm run deploy
```

Perintah memasang dependensi proyek otomatis bila belum tersedia, lalu menggunakan Netlify CLI **27.14.0**, melakukan build dan deploy produksi, termasuk Functions. Pada pemakaian pertama CLI meminta masuk ke akun Netlify dan memilih/membuat proyek. Itu satu-satunya akun yang diperlukan. Tidak memerlukan API key, variabel lingkungan aplikasi, database, atau kanal SMS. Biaya/kuota mengikuti paket Netlify yang digunakan.

**Status penyerahan:** kode dan konfigurasi disiapkan serta diuji; deployment pada akun Netlify pengguna belum dijalankan karena sesi pengerjaan tidak memiliki koneksi/kredensial Netlify. Tidak ada URL produksi yang diklaim sudah terbit.

### Deploy melalui Git

1. Buat repositori Git dan unggah **isi folder proyek** (termasuk `package-lock.json`, `netlify.toml`, `netlify/`, `server/`, `src/`, `public/`). Jangan unggah `node_modules`, `.env`, atau `.netlify`.
2. Di Netlify pilih **Add new project → Import an existing project**, lalu hubungkan repositori.
3. `netlify.toml` mengatur build `npm run build`, publish `dist`, Functions `netlify/functions`, dan Node 22. Tidak diperlukan perubahan pengaturan jika proyek berada pada root repo.
4. Bila proyek disimpan dalam subfolder repo, tetapkan Base directory ke folder tersebut. Cara paling sederhana adalah menjadikan isi folder proyek sebagai root repo.
5. Sesudah deploy, periksa `/api/health`, `/api/openapi.json`, lalu jalankan skrip demo.

Jangan deploy hanya dengan drag-and-drop folder `dist`: cara itu tidak menyertakan Functions. UI memiliki fallback lokal tetapi API publik memerlukan deployment lengkap. Tidak ada pengaturan database atau migrasi.

### Deploy melalui CLI, langkah eksplisit

```bash
npm ci
npm run check
npx netlify-cli@27.14.0 login
npx netlify-cli@27.14.0 deploy --build --prod
```

Untuk proyek yang sudah terhubung, CLI memakai asosiasi lokal di `.netlify` (diabaikan Git). Jangan membagikan token autentikasi dalam source atau chat.

## Cerita dan modul

- **Dasbor nasional:** delapan DAS, prioritas risiko, paparan sintetis, kesehatan lima konektor.
- **Peta risiko:** GeoJSON lokal, pilih DAS, zoom, empat lapisan ilustratif, kecamatan, paparan, kapasitas dan rencana rute evakuasi dummy.
- **Laboratorium fusi:** tiga preset, replay 11 titik waktu × 30 menit, interval tampilan 1,6 detik, slider manual, timeline berdampingan, kontribusi skor, prior/rasio bukti/posterior.
- **Posko BPBD:** kesiapan kecamatan, paparan, titik kumpul, alur keputusan dan mode uji coba.
- **Peringatan:** draf → verifikasi BPBD → latihan diseminasi tujuh kanal. Mode bayangan diblokir di UI dan API. Radio sengaja memerlukan retry pertama; percobaan ulang berhasil.
- **Laporan warga:** tanpa identitas, antrean validasi, laporan tervalidasi memperbarui risiko; laporan pending/rejected tidak memengaruhinya.
- **Interoperabilitas:** katalog lima sumber, metadata, kepemilikan data, fixture log federasi, log panggilan API sesi, API tester dan unduh OpenAPI.
- **Evaluasi bayangan:** confusion matrix, precision, recall, false alarm rate, lead time dari 33 observasi sintetis; semua rumus dan label dipaparkan.
- **Arsitektur:** LSTM/TCN + CNN + late fusion/attention + Bayesian sebagai konsep penelitian; penjelasan terpisah tentang algoritma yang sebenarnya dijalankan.
- **Audit & hak akses:** log sesi, matriks kewenangan, CSV, reset demo. Ekspor PDF tersedia pada peringatan: klik **Ekspor PDF**, kemudian **Unduh PDF**. Saat API terhubung, unduhan disajikan langsung oleh Function tanpa menyimpan dokumen; fallback lokal menggunakan tautan berkas di browser.
- **Tentang:** roadmap 60 bulan Bab 2.4, pentahelix, SDGs 9/11/13/15, posisi gagasan dan batasan.

Semua halaman Bahasa Indonesia, tema terang/gelap, navigasi ponsel, label selain warna, fokus keyboard, tautan lewati navigasi, dan dukungan reduced motion. Target WCAG AA dan Lighthouse >90 adalah target desain; lihat `docs/VERIFICATION.md` untuk hasil/ruang lingkup pemeriksaan yang benar-benar dilakukan.

## Mesin fusi: jujur dan dapat diulang

Implementasi: `src/shared/fusion.ts`, dipakai bersama oleh browser dan serverless.

1. Normalisasi empat fitur ke 0–1: hujan/220, degradasi hulu/80, lereng/50, muka air/500.
2. Bobot awal `[0,34; 0,22; 0,14; 0,30]` diberi penyesuaian berbasis aturan untuk degradasi, profil lereng dan Ciliwung, kemudian dinormalisasi. Ini **analog attention, bukan attention terlatih**.
3. Skor = jumlah kontribusi bobot × fitur + interaksi hujan × degradasi − faktor mitigasi hulu/muka air rendah. Skor dibatasi 0–1.
4. Log-likelihood pedagogis = `7 × (skor − 0,32)` + bukti warga tervalidasi. Log-odds bukti warga dibatasi total 0,42; ID laporan duplikat dihitung sekali, hanya untuk DAS yang sesuai.
5. Posterior = `sigmoid(logit(prior struktural DAS) + log-likelihood)`.
6. Level: Normal <25%; Waspada 25–<50%; Siaga 50–<75%; Awas ≥75%.

Prior Tamiang 16%, DAS lain 14%. Ini parameter ilustratif, **bukan prevalensi empiris**. Setiap snapshot dihitung ulang dari prior struktural yang sama; hasil render/retry tidak dijadikan bukti baru. Ini mencegah penghitungan ganda tetapi belum menerapkan filtering Bayesian asinkron multi-frekuensi penuh. Layer lahan/DEM tetap selama replay, hujan/hidrologi berubah. Belum ada penanganan keterlambatan sumber, staleness, imputasi, atau interval ketidakpastian yang tervalidasi.

Kontribusi yang ditampilkan adalah **poin skor sebelum sigmoid**, bukan kontribusi kausal dan bukan bagian persentase posterior. Risiko banjir/longsor menggunakan satu indeks bahaya gabungan; tidak ada dua model bahaya terpisah.

### Hasil yang diharapkan untuk skenario Tamiang

| Skenario                    | Perilaku yang diuji                                                                                           |
| --------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Hari Normal                 | Semua titik waktu berada pada level Normal                                                                    |
| Hujan Ekstrem + Hulu Gundul | Berawal Waspada karena kerentanan hulu, berkembang ke Awas; sinyal Siaga mendahului pembanding berbasis hujan |
| Alarm Palsu                 | Hujan sempat melewati ambang pembanding, tetapi fusi tetap Normal karena hulu terjaga dan muka air rendah     |

Pembanding “Sistem terpisah saat ini” adalah aturan buatan: hujan ≥180 mm/24 jam memicu alarm, dengan koordinasi manual dijelaskan secara naratif. **Bukan pengukuran sistem aktual BMKG/BNPB**. Penanda kejadian ekstrem buatan T+240 menit. Metrik evaluasi memakai label bahaya horizon sejak T+150 menit; ini sengaja membuat metrik tidak identik dengan penanda kejadian. Tiga replay ×11 snapshot =33 sampel berkorelasi, bukan set uji independen.

## Data, penyimpanan, dan peran

Seed tetap `2026`. Waktu simulasi dasar 21 Oktober 2026 pukul 08.00 WIB. Fixture dibuat dengan PRNG Mulberry32 dan konstanta; bukan data lapangan. Timestamp log bertambah berdasarkan urutan tindakan simulasi. Sesi demo disimpan hanya dalam `localStorage` dengan kunci `simpul-demo-v1`. Perangkat/peramban lain tidak berbagi perubahan. Reset tersedia untuk Admin Nasional melalui Audit & hak akses; bila localStorage tidak tersedia aplikasi tetap bekerja tanpa persistensi.

Enam peran: Admin Nasional BNPB, Operator BMKG, Operator Kemenhut/KLHK, Operator KemenPU/BIG, BPBD Daerah, Publik. Peran operator dapat memeriksa katalog/model tetapi tidak memverifikasi atau mendiseminasikan peringatan. Admin dan BPBD dapat memverifikasi, memvalidasi laporan dan mengganti mode. Publik dapat membaca risiko/peringatan dan mengirim laporan dummy.

`X-Demo-Role` **bukan autentikasi aman**; pengguna dapat memalsukannya. API mutasi stateless hanya memvalidasi dan mengembalikan objek transformasi. Tidak ada server session, JWT, database, integrasi IAM, enkripsi aplikasi, immutable audit trail, maupun backup terkelola. Data tidak sensitif dan tidak dikirim kepada pihak lain. Jangan gunakan PII atau kredensial nyata.

Katalog metadata adalah contoh kontrak yang diajukan, bukan jaminan format/resolusi/frekuensi API resmi instansi. Semua konektor pemerintah disimulasikan. Prinsip “data tetap di instansi” merupakan rancangan sistem nyata; pada demo seluruh nilai operasional adalah fixture yang sengaja tersedia bersama.

## Endpoint

Lihat `docs/API.md` dan `/api/openapi.json`. GET publik: `/health`, `/seed`, `/basins`, `/risk`, `/catalog`, `/exchanges`, `/evaluation`, `/cap`, `/report.pdf`, `/openapi.json`. POST: `/fuse`, `/reports`, `/reports/validate`, `/alerts/verify`, `/disseminate`. Seluruh path diawali `/api`.

CAP JSON/XML menggunakan namespace CAP 1.2, `status=Test`, `certainty=Possible`, `scope=Public` dan alamat pengirim `.invalid`. Tidak terhubung ke broker CAP, Pusdalops, SMS gateway atau kanal resmi. Belum divalidasi terhadap profil implementasi Indonesia.

**Live Data dinonaktifkan**: tidak ada proxy BMKG, request eksternal atau parsing XML masuk. Ini keputusan stabilitas dan konsistensi demo. Jika nanti ditambahkan, gunakan adapter server dengan cache, rate limit, parsing XML aman, attribution, freshness badge, dan fallback; pisahkan data aktual dari simulasi.

## Struktur

```text
src/
  App.tsx                  shell, login peran, navigasi hash
  components/              UI, peta SVG lokal
  pages/                   modul yang di-lazy-load
  shared/                  types, seed, fusion, CAP
  lib/                     sesi, permission, CSV/PDF
server/api.ts              handler Request/Response bersama
netlify/functions/api.mts  entrypoint Netlify dengan path /api/*
public/data/               GeoJSON peta dasar lokal
scripts/                  bootstrap dan pembuat peta
tests/                    uji model/API/PDF (tanpa layanan eksternal)
docs/                      API, sumber, verifikasi, pemeriksaan responsif internal
PLAN.md                    keputusan dan asumsi awal
DEMO-SCRIPT.md             naskah 5 menit untuk juri
netlify.toml               konfigurasi build, Functions, header dan SPA
```

## Verifikasi dan perintah pengembangan

```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run build
# atau semua pemeriksaan di atas:
npm run check
```

Peta/grafik berada pada modul lazy, GeoJSON dibaca hanya saat diperlukan, dan jsPDF dimuat saat ekspor. Tidak ada font, tile, analytics, atau CDN eksternal pada jalur demo. CSP membatasi resource pada origin sendiri; inline style diizinkan untuk visualisasi. Peta bukan Leaflet: SVG dengan GeoJSON gratis memberi peta interaktif tanpa beban library/tile eksternal.

`docs/mobile-check.html` adalah alat QA lokal dengan iframe 360/390/768 px; tidak masuk build produksi. Buka `/docs/mobile-check.html` saat `npm run dev` aktif. Dev server mengizinkan host QA `terminal.local` selain localhost; batas host lain tetap mengikuti Vite.

## Asumsi dan keputusan editorial

- **DAS Tamiang** dipilih untuk mengilustrasikan konteks Sumatra. Angka tidak merekonstruksi November 2025.
- Delapan DAS adalah sampel demonstrasi, bukan cakupan nasional operasional. Kecamatan nyata dipakai pada Tamiang hanya untuk konteks; jumlah, batas, fasilitas, koordinat presisi dan rute tidak resmi. Kecamatan di DAS lain jelas diberi label ilustrasi.
- Kementerian disebut **Kementerian Kehutanan (sebelumnya KLHK)**, dengan label singkat Kemenhut pada visual.
- Roadmap mengikuti **Bab 2.4**: 1–12, 13–30, 31–42, 43–60 bulan. Perbedaan dengan Bab 3.2 yang menyebut 120 bulan dicatat; tidak digabungkan menjadi janji implementasi.
- Pentahelix dibuat eksplisit menjadi pemerintah, akademisi, dunia usaha, masyarakat, media. Tidak menyiratkan komitmen kelembagaan nyata.
- Statistik latar proposal tidak dipakai pada KPI kinerja aplikasi; rujukan proposal ditampilkan di Tentang sebagai rujukan yang memerlukan verifikasi tersendiri.
- Keputusan sederhana: database dan Blobs tidak dibutuhkan untuk demo satu perangkat; tidak ada seed/migrasi server yang harus dikelola.
- Halaman laboratorium mempertahankan preset selama kunjungan halaman; meninggalkan halaman mereset replay. Draf yang diteruskan ke BPBD menyimpan snapshot level/probabilitas dan pesan hasil slider/replay saat itu. Dasbor tetap menampilkan snapshot pemantauan awal + bukti warga tervalidasi.

## Untuk menggunakan data nyata

Ganti adapter seed dengan API resmi berdasarkan perjanjian pertukaran data; simpan provenance, event ID, unit, CRS, timestamp observasi dan ingestion. Tambahkan mekanisme staleness/missing data, model per bahaya yang dilatih dan dikalibrasi, validasi historis independen lintas DAS, observabilitas, penyimpanan audit tahan manipulasi, autentikasi/otorisasi server, keamanan, retensi, backup dan pemulihan. Integrasi kanal membutuhkan provider dan SOP serta verifikasi manusia. Jangan sekadar mengganti label “simulasi” atau memasukkan API key ke browser.

Rujukan teknis dan lisensi peta: `docs/SOURCES.md`.
