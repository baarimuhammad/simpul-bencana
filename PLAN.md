# Rencana implementasi SIMPUL BENCANA

## Pemahaman laporan

Lapisan interoperabilitas, bukan sensor atau repositori pengganti. Data atmosfer BMKG, lahan Kementerian Kehutanan (sebelumnya KLHK), hidrologi KemenPU, dan geospasial BIG dipadukan untuk mendukung keputusan BNPB/BPBD. Model konseptual adalah LSTM/TCN + CNN + late fusion/attention + pembaruan Bayesian. Implementasi prototipe secara eksplisit menggunakan skor deterministik. Verifikasi BPBD mendahului simulasi diseminasi. Bab 2.4 (empat tahap, bulan 1–60) menjadi acuan roadmap; perbedaan dengan Bab 3.2 dicatat.

## Keputusan

- React + TypeScript + Vite, CSS mandiri, ikon Lucide; halaman dan peta dimuat secara malas.
- Netlify Functions menggunakan Request/Response; handler identik juga dipakai middleware pengembangan Vite.
- Tanpa database: seed otomatis dan deterministik, perubahan sesi di localStorage; server stateless. Tidak ada migrasi, API key, layanan SMS, atau WebSocket.
- Peta vektor GeoJSON Natural Earth lokal (public domain), tanpa tile eksternal. Batas DAS, lapisan, dan rute evakuasi adalah ilustrasi sintetis.
- DAS Tamiang menjadi pilot; beberapa DAS pembanding di Sumatra, Jawa, Kalimantan, Sulawesi, Papua.
- Tidak mengaktifkan live BMKG agar cerita demo selalu deterministik dan tidak tercampur data aktual.
- Target platform Netlify secara eksplisit mengesampingkan hosting Sites. Seluruh source, konfigurasi, dan ZIP akan diserahkan; deploy aktual memerlukan akun Netlify milik pengguna.

## Arsitektur informasi

1. Dasbor nasional: KPI, peta, prioritas DAS, linimasa, kesehatan sumber.
2. Peta risiko: layer, pemilihan DAS, drill-down kecamatan, paparan/evakuasi.
3. Laboratorium fusi: tiga replay, slider, kontribusi, prior/posterior, pembanding terpisah vs terpadu.
4. Posko BPBD: kesiapan, verifikasi, titik kumpul, rekomendasi tindakan.
5. Peringatan: CAP Test, verifikasi manusia, simulasi tujuh kanal, ekspor.
6. Interoperabilitas: katalog, query federatif ilustratif, log API aktual sesi, dokumentasi OpenAPI.
7. Evaluasi bayangan: toggle mode, confusion matrix dan metrik dihitung dari observasi sintetis.
8. Laporan warga: form tanpa identitas, validasi BPBD, pembaruan risiko terbatas.
9. Arsitektur model, Tentang, Audit & hak akses.

## Skema data

Basin { id, name, province, coordinates, profile, inputs, districts, exposure, shelters, readiness }; Observation { timestamp, source, value, unit, quality }; FusionResult { probability, level, prior, evidence, contributions, weights }; DemoState { schemaVersion, role, mode, scenario, tick, reports[], alerts[], audit[] }; Alert { id, basinId, level, status, channels[], cap }; CitizenReport { id, basinId, kind, severity, note, status }; AuditEvent { id, timestamp, actor, action, detail }. Semua data operasional adalah dummy; peta dasar hanya referensi geografis.

## Endpoint

GET /api/health, /api/seed, /api/basins, /api/risk?basin=tamiang&scenario=extreme&step=8, /api/catalog, /api/exchanges, /api/evaluation, /api/openapi.json, /api/report.pdf (GET/POST), /api/cap?basin=tamiang; POST /api/fuse, /api/reports, /api/reports/validate, /api/alerts/verify, /api/disseminate. Role demo diperiksa di UI dan API, tetapi bukan batas keamanan produksi. Seluruh mutasi API adalah transformasi stateless dengan status dan respons simulasi yang eksplisit.

## Urutan & penerimaan

Scaffold → seed/model → handler/serverless → antarmuka → responsif → typecheck/lint/unit/API/build → replay/peran/mobile → README/DEMO-SCRIPT/ZIP. Uji kasus Normal, Ekstrem, Alarm Palsu, pembaruan identik, validasi input, RBAC, dan blok diseminasi pada mode bayangan. Lighthouse >90 merupakan target, bukan klaim sebelum pengukuran.
