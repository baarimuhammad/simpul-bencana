# Naskah demo SIMPUL BENCANA · 5 menit

**Tujuan:** juri memahami fragmentasi → interoperabilitas → fusi yang dijelaskan → keputusan BPBD → koordinasi.

## Sebelum mulai

Jalankan `npm run dev`, atau buka hasil deploy Netlify. Pilih Admin Nasional BNPB. Untuk kondisi awal yang bersih buka Audit & hak akses → Reset seluruh demo, lalu masuk lagi. Tema terang, DAS Tamiang, mode bayangan. Siapkan tab browser dengan lebar sekitar 1366 px. Seluruh data dan waktu adalah simulasi; jangan menyebut angka hasil replay sebagai capaian penelitian.

## 0:00–0:40 · Masalah: data ada, tetapi tersebar

**Layar:** Dasbor nasional.

**Narasi:** “SIMPUL BENCANA berangkat dari masalah fragmentasi. BMKG membaca atmosfer, Kementerian Kehutanan membaca kondisi hulu, KemenPU membaca sungai, dan BIG menyediakan referensi geospasial. BPBD membutuhkan semuanya menjadi satu keputusan. Ini prototipe akademik: semua data operasional di sini simulasi, bukan peringatan resmi.”

**Aksi:** tunjukkan banner, peta, dan DAS Tamiang. Klik Batang Anai lalu Tamiang untuk menunjukkan perubahan konteks, bukan sekadar peta statis.

## 0:40–1:15 · Menyatukan tanpa mengambil alih

**Layar:** Interoperabilitas.

**Narasi:** “Kami tidak mengusulkan sensor baru atau memindahkan seluruh data ke BNPB. Dalam rancangan nyata, data tetap di instansi dan di-query melalui kontrak API bersama. Yang disatukan adalah referensi waktu, wilayah, kualitas, dan pemahamannya.”

**Aksi:** tunjukkan tabel **Status asal data pada prototipe**, diagram federasi, pemilik data, format/frekuensi dan metadata. Pilih endpoint `/risk?basin=tamiang&scenario=extreme&step=8`, klik **Uji endpoint**. Jelaskan bahwa endpoint benar-benar bekerja dengan data dummy; koneksi pemerintah belum diaktifkan.

## 1:15–2:35 · Adegan kunci: dari hujan menjadi penjelasan risiko

**Layar:** Laboratorium fusi, DAS Tamiang.

**Aksi:** pilih **Hujan Ekstrem + Hulu Gundul**, klik **Putar replay**. Replay lengkap sekitar 18 detik. Sambil berjalan tunjukkan dua timeline. Bila perlu gunakan slider **Titik waktu replay** untuk melompat ke T+180 atau T+300.

**Narasi:** “Di kiri, pembanding hipotetis menunggu ambang hujan. Di kanan, hujan dibaca bersama degradasi hulu, lereng, dan muka air. Bobotnya menyesuaikan konteks DAS. Risiko meningkat sebelum ambang hujan pembanding tercapai. Selisih waktunya adalah ilustrasi simulasi, bukan ukuran peningkatan kinerja lapangan.”

**Aksi:** tunjukkan kontribusi empat faktor, interaksi, prior → rasio bukti → posterior. Geser muka air turun, lalu kembalikan lewat preset bila ingin memperlihatkan perubahan.

**Narasi:** “Hasilnya tidak hanya ‘Awas’, tetapi menjelaskan parameter yang berkontribusi. Untuk demo kami menggunakan scoring deterministik dengan analog pembaruan Bayesian. LSTM/TCN, CNN dan attention adalah arsitektur penelitian yang belum dilatih pada prototipe.”

**Aksi:** pilih **Alarm Palsu**, geser waktu ke tengah replay (T+150). Tunjukkan hujan tinggi, hulu baik dan muka air rendah: pembanding memberi alarm, fusi tetap Normal. Pilih kembali ekstrem dan geser ke akhir sebelum melanjutkan.

## 2:35–3:40 · BPBD memutuskan, multikanal menjangkau

**Aksi:** pada akhir replay ekstrem klik **Lanjut ke verifikasi BPBD**. Snapshot hasil dibuat sebagai draf dan posko terbuka. Tunjukkan kesiapan kecamatan dan titik kumpul dummy. Klik **Tinjau peringatan & verifikasi**. Pilih draf terbaru bila perlu.

**Narasi:** “Analisis memberi rekomendasi; BPBD memegang keputusan. Pada mode bayangan, sistem hanya mengamati. Tombol pengiriman diblokir, termasuk oleh API.”

**Aksi:** tunjukkan snapshot input dan dua faktor utama pada draf. Centang tiga pemeriksaan data, area, dan pesan setelah menerangkan bahwa semua pemeriksaan ini latihan pada fixture; klik **Verifikasi BPBD**. Tunjukkan bahwa diseminasi masih diblokir. Ubah ke **Operasional terbatas**, klik **Simulasikan diseminasi**.

**Narasi:** “Setelah verifikasi dan hanya dalam latihan operasional terbatas, peringatan berisi instruksi Bahasa Indonesia yang dapat ditindaklanjuti. Tujuh kanal disimulasikan: SMS, cell broadcast, aplikasi, sirene, radio komunitas, pengeras suara desa, dan media sosial. Tidak ada pesan aktual yang dikirim.”

**Aksi:** tunjukkan kanal radio yang memerlukan retry; klik **Coba ulang kanal radio**. Bila waktu cukup buka CAP JSON: status **Test**, bukan Actual.

## 3:40–4:15 · Warga menjadi bukti, bukan pemicu tanpa validasi

**Layar:** Laporan warga.

**Aksi:** gunakan laporan bawaan yang pending. Tunjukkan persentase sebelum/sesudah dan klik **Validasi** pada laporan itu. Tidak perlu mengetik data saat presentasi.

**Narasi:** “Laporan kenaikan muka air dari relawan belum memengaruhi risiko sebelum diperiksa BPBD. Sesudah validasi, bukti unik memperbarui estimasi secara terbatas. Bukti duplikat tidak boleh berulang kali menaikkan risiko.”

## 4:15–5:00 · Tata kelola dan jalan menuju penerapan

**Layar:** Evaluasi bayangan, kemudian Tentang SIMPUL.

**Narasi:** “Di tahap uji coba, prediksi perlu dibandingkan dengan kejadian. Metrik di layar dihitung dari data sintetis; ini belum menunjukkan kelayakan operasional. Model harus diuji independen dan dikalibrasi pada setiap DAS.”

**Aksi:** buka Arsitektur Model sekilas untuk menunjuk input → proses → keluaran; lalu Tentang untuk matriks proposal → demonstrasi → batas bukti, posisi terhadap BMKG/InaRISK, dan empat tahap roadmap: Persiapan 1–12, Integrasi 13–30, Uji coba 31–42, Evaluasi 43–60 bulan. Tunjukkan pentahelix dan SDGs bila waktu cukup.

**Penutup:** “Kebaruan yang kami ajukan adalah lapisan pemahaman lintas data: kepemilikan tetap pada instansi, hasil dapat dijelaskan, keputusan tetap pada manusia, dan respons menjangkau masyarakat lewat banyak kanal.”

## Jika hanya diberi 3 menit

Dasbor 20 detik → Interoperabilitas 25 detik → Laboratorium ekstrem dan alarm palsu 70 detik → verifikasi/diseminasi 45 detik → roadmap dan batasan 20 detik. Lewati pengisian laporan dan ekspor PDF.

## Jika jaringan tidak tersedia

Setelah dependensi terpasang, jalankan lokal. Peta, seed dan model tidak membutuhkan layanan eksternal. Jika Function gagal pada situs statis, badge **Fallback lokal aktif** muncul dan handler yang sama menjalankan transformasi simulasi di browser. Jangan mengklaim API jaringan berhasil ketika badge fallback tampil.

## Jawaban singkat untuk pertanyaan juri

- **“Apakah akurasinya sudah terbukti?”** Belum. Metrik hanya berasal dari fixture dan belum mewakili performa nyata.
- **“Apakah data instansi sudah terhubung?”** Belum; kontrak, katalog dan API diperagakan dengan data dummy. Koneksi resmi memerlukan kerja sama institusi.
- **“Apakah ini melatih AI?”** Tidak. Arsitektur penelitian dijelaskan terpisah; prototipe menggunakan scoring transparan.
- **“Apa bedanya dengan BMKG dan InaRISK?”** BMKG menyediakan sinyal dan peringatan cuaca; InaRISK menyajikan pengetahuan risiko wilayah. Usulan SIMPUL memadukan sinyal cuaca, kondisi hulu, lereng, dan muka air per DAS menjadi rekomendasi yang dapat ditelusuri sampai keputusan BPBD. Ini hipotesis kontribusi, belum bukti lebih baik atau lebih cepat.
- **“Mengapa ada dua durasi dalam laporan?”** Demo mengikuti Bab 2.4 (60 bulan). Perbedaan Bab 3.2 (120 bulan) perlu diselaraskan pada revisi naskah proposal.
