# CodeLearn (versi Netlify)

Media pembelajaran interaktif dasar Python, dengan fitur **Tanya Kodi (AI)** yang berjalan lewat Gemini API. Proyek Learning Media, Kelompok 3, Mata Kuliah Generative AI.

## Isi folder

| File | Fungsi |
| --- | --- |
| `index.html` | Website CodeLearn (frontend) |
| `netlify/functions/tanya.mjs` | Fungsi server (backend): menyimpan API key secara rahasia, menyusun prompt tutor, dan memanggil Gemini API |
| `netlify.toml` | Pengaturan Netlify |

Alurnya: website memanggil `/api/tanya` → fungsi Netlify menambahkan aturan tutor dan API key → Gemini menjawab → jawaban tampil di panel Tanya Kodi.

## Langkah 1: Buat API key Gemini

1. Buka [Google AI Studio](https://aistudio.google.com/apikey) dan masuk dengan akun Google.
2. Klik **Create API key**, lalu salin key-nya.
3. **Jangan bagikan key ini** dan jangan menaruhnya di `index.html` atau di GitHub.

Batas pemakaian gratis bisa dilihat di [halaman rate limit AI Studio](https://aistudio.google.com/rate-limit).

## Langkah 2: Unggah ke GitHub

1. Buat repository baru di GitHub, misalnya `codelearn`.
2. Unggah seluruh isi folder ini (`index.html`, `netlify.toml`, folder `netlify`, `README.md`), dengan struktur folder tetap sama.

## Langkah 3: Deploy di Netlify

1. Masuk ke [Netlify](https://app.netlify.com) dengan akun GitHub.
2. Pilih **Add new site → Import an existing project → GitHub**, lalu pilih repository `codelearn`.
3. Biarkan pengaturan build kosong (sudah diatur oleh `netlify.toml`), lalu klik **Deploy**.
4. Buka **Site configuration → Environment variables → Add a variable**:
   - Key: `GEMINI_API_KEY`
   - Value: API key dari Langkah 1
5. Buka tab **Deploys → Trigger deploy → Deploy site** supaya key-nya terbaca.
6. Ganti nama situs di **Site configuration → Change site name**, misalnya `codelearn-kelompok3`.

Catatan: fitur AI butuh deploy lewat GitHub (atau Netlify CLI). Deploy dengan cara seret-lepas (Netlify Drop) tidak menjalankan fungsi server.

## Opsional: ganti model AI

Model bawaan adalah `gemini-3.8-flash`. Untuk menggantinya, tambahkan environment variable `GEMINI_MODEL`, misalnya `gemini-3.5-flash-lite`. Daftar model ada di [dokumentasi Gemini](https://ai.google.dev/gemini-api/docs/models).

## Menjalankan di komputer sendiri (VS Code)

- **Tanpa AI:** buka `index.html` dengan ekstensi Live Server. Semua fitur jalan kecuali Tanya Kodi.
- **Dengan AI:** pasang [Node.js](https://nodejs.org), lalu di terminal VS Code jalankan:
  ```
  npm install -g netlify-cli
  netlify dev
  ```
  Simpan API key di file `.env` berisi `GEMINI_API_KEY=key_kamu`, dan **jangan unggah file `.env` ke GitHub**.

## Keamanan

- API key hanya ada di server Netlify, tidak pernah dikirim ke browser.
- Aturan tutor disusun di server, jadi fungsi ini tidak bisa dipakai sebagai chatbot bebas.
- Panjang kode dan pertanyaan dibatasi agar pemakaian kuota tetap hemat.
