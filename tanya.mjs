// Tanya Kodi (AI) — fungsi server di Netlify.
// Menyimpan API key Gemini secara rahasia dan meneruskan pertanyaan siswa ke AI.
// API key diatur di Netlify: Site configuration → Environment variables → GEMINI_API_KEY

const MODEL_DEFAULT = "gemini-3.8-flash";

// Instruksi tetap untuk AI. Disusun di server agar fungsi ini hanya bisa dipakai
// sebagai tutor CodeLearn, bukan sebagai chatbot umum.
const SYSTEM = `Kamu adalah Kodi, tutor pemrograman Python yang sabar untuk mahasiswa pemula di Indonesia, di dalam media pembelajaran CodeLearn.
Aturan:
- Jawab dalam Bahasa Indonesia yang sederhana dan ramah, maksimal sekitar 150 kata.
- Gunakan istilah yang dipakai di materi modul.
- Boleh menyertakan potongan kode pendek (maksimal 3 baris) dalam blok \`\`\`python.
- Jangan pernah menuliskan solusi lengkap latihan.
- Jika pertanyaan tidak berkaitan dengan belajar pemrograman, arahkan kembali ke materi dengan sopan.
- Akhiri dengan satu pertanyaan atau ajakan kecil agar siswa mencoba sendiri.`;

const TASKS = {
  salah: "Siswa bertanya: kenapa kodenya belum benar? Temukan kesalahan utamanya dan jelaskan penyebabnya. Beri petunjuk cara memperbaikinya, tapi JANGAN tulis kode jawaban lengkap.",
  langkah: "Siswa meminta petunjuk langkah berikutnya. Beri SATU langkah kecil yang konkret sesuai kode yang sudah ia tulis. JANGAN tulis kode jawaban lengkap.",
  jelaskan: "Siswa meminta penjelasan kodenya baris per baris. Jelaskan apa yang dilakukan setiap baris dengan bahasa sederhana. Jika ada baris yang salah, tandai dan beri petunjuk singkat.",
  bebas: "Jawab pertanyaan siswa dalam konteks materi modul ini. Jika jawabannya adalah solusi latihan, beri petunjuk saja."
};

const cut = (v, n) => String(v ?? "").slice(0, n);
const reply = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

export default async (req) => {
  if (req.method !== "POST") return reply(405, { error: "Gunakan metode POST." });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return reply(500, { error: "API key belum diatur di Netlify (GEMINI_API_KEY)." });

  let b;
  try { b = await req.json(); } catch { return reply(400, { error: "Format permintaan tidak valid." }); }

  const kind = Object.hasOwn(TASKS, b.kind) ? b.kind : null;
  if (!kind) return reply(400, { error: "Jenis pertanyaan tidak dikenal." });
  const question = cut(b.question, 500).trim();
  if (kind === "bebas" && !question) return reply(400, { error: "Pertanyaannya masih kosong." });

  const prompt = `Modul: ${cut(b.modul, 120)}
Soal latihan: ${cut(b.soal, 1000)}
Output yang diharapkan:
${cut(b.expected, 500)}
Syarat: kode harus memakai ${Array.isArray(b.must) ? b.must.slice(0, 5).map(x => cut(x, 20)).join(", ") : "-"}.

Kode siswa saat ini:
\`\`\`python
${cut(b.code, 4000)}
\`\`\`
Hasil pengecekan terakhir: ${cut(b.lastCheck, 600) || "belum dicek"}
${kind === "bebas" ? `\nPertanyaan siswa: "${question}"` : ""}
Tugas: ${TASKS[kind]}`;

  const model = process.env.GEMINI_MODEL || MODEL_DEFAULT;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM }] },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 800, temperature: 0.4 }
        })
      }
    );
    const data = await res.json().catch(() => ({}));
    if (res.status === 429) return reply(429, { error: "Kodi sedang sibuk (batas pemakaian tercapai). Coba lagi sebentar lagi." });
    if (!res.ok) {
      console.error("Gemini error", res.status, JSON.stringify(data).slice(0, 500));
      return reply(502, { error: "AI sedang bermasalah. Coba lagi sebentar lagi." });
    }
    const text = (data.candidates?.[0]?.content?.parts || []).map(p => p.text || "").join("").trim();
    if (!text) return reply(502, { error: "AI tidak memberi jawaban. Coba pertanyaan yang lebih singkat." });
    return reply(200, { text });
  } catch (e) {
    console.error(e);
    return reply(502, { error: "Koneksi ke AI terputus. Coba lagi." });
  }
};

// Fungsi ini bisa dipanggil dari website lewat alamat /api/tanya
export const config = { path: "/api/tanya" };
