# API publik simulasi

Base URL lokal `http://localhost:5173/api`; pada Netlify origin situs + `/api`. Semua respons memuat header `X-Simpul-Data: simulation`. Tidak ada login nyata, database, pengiriman pesan, atau integrasi pemerintah. Mutasi stateless; caller menyimpan respons dalam sesi demo sendiri.

Spesifikasi OpenAPI 3.1 lengkap dapat diunduh di `/api/openapi.json`, termasuk request schema, role header, rentang input dan response status. Body maksimum 32 KiB. Respons error JSON mempunyai `error` dan `simulated: true`. API tester tersedia di modul Interoperabilitas.

| Metode | Endpoint                                      | Fungsi                                                        |
| ------ | --------------------------------------------- | ------------------------------------------------------------- |
| GET    | `/health`                                     | Status, seed dan waktu simulasi, status persistensi/live data |
| GET    | `/seed`                                       | Fixture DAS, katalog dan laporan awal                         |
| GET    | `/basins`                                     | Semua DAS beserta hasil risiko snapshot                       |
| GET    | `/risk?basin=tamiang&scenario=extreme&step=8` | Risiko dan kontribusi; scenario opsional, step 0–10           |
| GET    | `/catalog`                                    | Format, resolusi, frekuensi, kualitas dan pemilik dummy       |
| GET    | `/exchanges`                                  | Fixture pertukaran federasi, bukan trafik ke instansi         |
| GET    | `/evaluation?basin=tamiang`                   | Metrik dan 33 observasi sintetis                              |
| GET    | `/cap?basin=tamiang`                          | CAP Test sebagai struktur JSON                                |
| GET    | `/cap?basin=tamiang&format=xml`               | XML CAP 1.2, status Test                                      |
| GET    | `/openapi.json`                               | Kontrak mesin OpenAPI                                         |
| POST   | `/fuse`                                       | Fusi input numerik yang tervalidasi                           |
| POST   | `/reports`                                    | Bentuk laporan pending tanpa identitas                        |
| POST   | `/reports/validate`                           | BPBD/admin menerima atau menolak laporan                      |
| POST   | `/alerts/verify`                              | BPBD/admin memverifikasi draf                                 |
| POST   | `/disseminate`                                | Simulasi kanal, hanya mode limited dan alert verified         |

## Contoh lintas platform

Buka GET langsung melalui browser atau gunakan curl:

```bash
curl 'http://localhost:5173/api/risk?basin=tamiang&scenario=extreme&step=8'
```

Untuk POST, simpan body di `payload.json` agar tidak perlu menangani escape JSON shell Windows/Linux:

```json
{
  "basinId": "tamiang",
  "inputs": { "rain": 210, "forestLoss": 61, "slope": 36, "water": 470 }
}
```

```bash
curl -X POST http://localhost:5173/api/fuse -H "Content-Type: application/json" -H "X-Demo-Role: admin" --data-binary @payload.json
```

Fusi menerima hujan 0–500 mm/24 jam, degradasi 0–100%, lereng 0–90°, muka air 0–1000 cm. Semua parameter harus angka finite; fitur dinormalisasi dan dibatasi di mesin.

Body laporan:

```json
{
  "basinId": "tamiang",
  "district": "Karang Baru",
  "kind": "Muka air naik",
  "severity": 2,
  "note": "SIMULASI: air mendekati penanda tepi sungai.",
  "sequence": 2
}
```

`/reports` mengembalikan `{report, simulated: true, persisted: false}` dengan HTTP 201. Kirim objek `report` yang sama ke `/reports/validate` bersama `basinId` dan `accept: true/false`; header role `bpbd` atau `admin`.

`/alerts/verify` menerima `{basinId, alert}` dengan `alert.status: draft`. Gunakan objek Alert dari UI atau skema OpenAPI. Hasil `alert.status: verified` dan `verifiedBy` wajib dipakai untuk `/disseminate`:

```json
{
  "basinId": "tamiang",
  "mode": "limited",
  "retry": false,
  "alert": {
    "id": "SB-SIM-API-001",
    "basinId": "tamiang",
    "level": "Awas",
    "probability": 0.9,
    "status": "verified",
    "verifiedBy": "bpbd",
    "created": "2026-10-21T01:00:00.000Z",
    "message": "LATIHAN / DATA SIMULASI. Bukan peringatan aktual.",
    "channels": []
  }
}
```

Mode `shadow` mendapat 403. Alert belum verified mendapat 400. Peran selain admin/bpbd mendapat 403. Pengiriman valid mengembalikan tujuh kanal, `externalMessagesSent: 0`; radio mendapat status `retry` pada percobaan pertama. Untuk retry kirim snapshot alert yang sama sebagai verified dengan `retry: true`, sebagaimana ditunjukkan UI.

## Keterbatasan keamanan

Role diklaim melalui header dan `verifiedBy` berada pada payload, sehingga bisa dipalsukan. Pemeriksaan ini untuk memperagakan alur kerja, bukan trust boundary produksi. HTTP API tidak menyimpan hasil atau mengautentikasi manusia. Tidak ada PII atau rahasia yang boleh dimasukkan.

## Unduhan PDF langsung

`GET /api/report.pdf` menghasilkan ringkasan risiko seed sebagai HTTP attachment `application/pdf`. `POST /api/report.pdf` menerima form `application/x-www-form-urlencoded` dengan field `payload`, berisi JSON `{title, lines}` untuk mengekspor snapshot sesi. Maksimal 128 KiB input, judul 100 karakter, 400 baris masing-masing maksimal 2.000 karakter. Label **PROTOTIPE - DATA SIMULASI** ditambahkan pada dokumen. Respons menggunakan `Content-Disposition: attachment`; tidak ada berkas yang dipersistensikan di server. Tidak perlu header peran untuk transformasi dokumen dummy ini. Tidak ada data instansi nyata atau data pribadi yang boleh dimasukkan.
