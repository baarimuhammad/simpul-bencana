# Verifikasi prototipe · 21 Oktober 2026

## Pemeriksaan yang lulus

| Pemeriksaan       | Hasil dan cakupan                                                                                                                                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TypeScript        | `npm run typecheck` lulus, termasuk client, handler API, Netlify entrypoint, dan tes                                                                                                                                |
| Lint              | `npm run lint` lulus                                                                                                                                                                                                |
| Tes otomatis      | **34 tes lulus** dalam 3 berkas: mesin fusi, API/role/mode, generator PDF dan HTTP attachment                                                                                                                       |
| Build produksi    | `npm run build` lulus dengan Vite 8.3.4 dan TypeScript 5.9.3                                                                                                                                                        |
| Bundel Netlify    | `npm run check:functions` lulus dengan bundler resmi Netlify; manifest mengenali `api`, Node 22, invocation API v2, route `/api/*`                                                                                  |
| Pratinjau lokal   | Aplikasi dijalankan dan diperiksa dalam Chrome; API tester menghasilkan respons risiko dari handler lokal                                                                                                           |
| Replay            | Hari Normal tetap Normal; ekstrem berkembang menjadi Awas; alarm palsu memicu pembanding hujan tetapi tidak meningkatkan fusi ke Siaga                                                                              |
| Human-in-the-loop | Draf dari replay diteruskan ke BPBD; verifikasi wajib; diseminasi diblokir saat bayangan; 7 kanal disimulasikan pada limited                                                                                        |
| Gangguan kanal    | Radio diberi retry pada pengiriman pertama, kemudian seluruh kanal sukses dalam simulator; 0 pesan aktual                                                                                                           |
| Laporan warga     | Form dummy berhasil mengantre; validasi BPBD mengubah probabilitas snapshot Tamiang dari sekitar 90% ke 92%; pending tidak berpengaruh                                                                              |
| Enam peran        | Ketiga operator dan Publik tidak dapat membuat draf / mengganti mode. Admin dan BPBD dapat. Navigasi berbeda sesuai peran                                                                                           |
| Responsif         | Semua 11 modul diperiksa pada viewport ponsel: dasbor 390 px, 10 modul lain 360 px. Tidak ada overflow horizontal dokumen; tabel sengaja dapat digeser                                                              |
| Desktop           | Dasbor, peta, laboratorium, respons BPBD, katalog, laporan, dan navigasi diperiksa pada Chrome desktop                                                                                                              |
| PDF               | Dokumen mempunyai header `%PDF-`, penutup `%%EOF`, isi sampai baris terakhir dan label simulasi di beberapa halaman. Handler HTTP mengembalikan `application/pdf` dan attachment; UI menyiapkan tautan/tombol unduh |
| Error aplikasi    | Tidak ditemukan console error aplikasi pada jalur demo yang diperiksa. Log ekstensi browser berada di luar aplikasi                                                                                                 |

Perintah gabungan yang dijalankan terakhir adalah `npm run check`: typecheck → lint → 34 tes → build → bundel Functions. Lingkungan pengujian Node 24.19.0; konfigurasi deploy Node 22. Dependensi langsung dan transitif dikunci. Seluruh mesin/API stateless tidak memerlukan layanan eksternal untuk tes.

## Hasil replay yang diamati pada UI (seluruhnya simulasi)

- Hari Normal, T+300 menit: probabilitas sekitar 10%, tanpa sinyal peringatan.
- Ekstrem, T+300: sekitar 96%, Awas. Sinyal fusi pertama T+90; pembanding hujan T+240. Selisih 150 menit adalah hasil fixture, **bukan peningkatan performa nyata**.
- Alarm Palsu, T+150: sekitar 14%, Normal; pembanding berbasis hujan telah memicu alarm.

Nilai dapat naik terbatas setelah laporan dummy tervalidasi. Angka di atas dicatat sebelum penambahan bukti warga. Tidak ada data hasil pelatihan atau pengujian lapangan.

## Batas verifikasi

- **Belum dipublikasikan ke akun Netlify pengguna.** Akses akun/kredensial tidak tersedia. Bundel Functions dan konfigurasi siap, tetapi cold start, domain produksi, quota, dan routing pada deployment nyata belum diuji.
- **Lighthouse belum diukur.** >90 tetap target, bukan skor yang diklaim. Build utama sekitar 86 KB gzip, CSS sekitar 13 KB gzip; peta/halaman/PDF dimuat sesuai kebutuhan. Ukuran bundel bukan pengganti pengukuran performa.
- Pengujian ponsel menggunakan viewport iframe Chrome, bukan perangkat fisik, emulasi touch penuh, atau matriks seluruh browser.
- Dasar aksesibilitas tersedia, termasuk label status, fokus keyboard, skip link, reduced motion dan menu seluler yang keluar dari accessibility tree saat ditutup. Audit WCAG AA menyeluruh/screen reader independen belum dilakukan.
- Otomatisasi browser tidak mengonfirmasi event download PDF hingga selesai (timeout pada saluran pengamatan download). Generator byte PDF, HTTP attachment dan penyiapan kontrol UI lulus; unduhan final tetap perlu smoke test pada browser pengguna/deployment. Jalur HTTP langsung ditambahkan untuk menghindari ketergantungan pada unduhan blob asinkron, dengan fallback lokal.
- CAP XML telah diperiksa struktur dasar, namespace dan status Test; belum divalidasi dengan XSD atau profil implementasi nasional.
- Tidak ada live BMKG, jaringan instansi, SMS gateway, sirene, sistem radio, maupun pengukuran jangkauan masyarakat yang diuji.
- Dua warning build Lucide tentang direktif `use client` adalah warning bundler SPA; bukan console error runtime. Tidak ada error build.

## Pemeriksaan setelah deploy

1. Buka `/api/health`, pastikan `simulated: true` dan `seed: 2026`.
2. Buka `/api/risk?basin=tamiang&scenario=extreme&step=8` dan `/api/openapi.json`.
3. Jalankan `DEMO-SCRIPT.md`: replay, verifikasi, blok shadow, limited, retry radio, validasi laporan.
4. Klik Ekspor PDF → Unduh PDF, serta ekspor CSV; periksa berkas hasil di browser pengguna.
5. Ukur Lighthouse pada build produksi, periksa ponsel fisik dan aksesibilitas sebelum presentasi publik.
