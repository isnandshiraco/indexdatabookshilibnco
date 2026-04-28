import { google } from "googleapis";

const MAX_RESULTS = 100;
const MIN_QUERY_LENGTH = 3;

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Metode tidak diizinkan." });
  }

  const query = String(req.query.q || "").trim().toLowerCase();
  const filter = String(req.query.filter || "all").trim().toLowerCase();

  if (query.length < MIN_QUERY_LENGTH) {
    return res.status(400).json({
      error: `Masukkan minimal ${MIN_QUERY_LENGTH} huruf.`
    });
  }

  try {
    const rows = await readSheetRows();
    const results = rows
      .filter((book) => matchesFilter(book, query, filter))
      .slice(0, MAX_RESULTS);

    return res.status(200).json({
      data: results,
      limited: results.length === MAX_RESULTS,
      maxResults: MAX_RESULTS
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Database buku belum bisa dibaca."
    });
  }
}

function matchesFilter(book, query, filter) {
  // Tambahkan "bahasa" sebagai bidang yang dapat difilter langsung
  const allowedFields = ["judul", "penulis", "genre", "penerbit", "tahun", "bahasa"];

  if (allowedFields.includes(filter)) {
    return String(book[filter] || "").toLowerCase().includes(query);
  }

  // Pencarian "all": periksa semua properti (termasuk bahasa & sinopsis jika diinginkan)
  return Object.values(book).some((value) =>
    String(value || "").toLowerCase().includes(query)
  );
}

async function readSheetRows() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  // Rentang diperluas hingga kolom G: A=judul, B=penulis, C=genre, D=penerbit, E=tahun, F=bahasa, G=sinopsis
  const range = process.env.GOOGLE_SHEET_RANGE || "Sheet1!A:G";

  if (!clientEmail || !privateKey || !spreadsheetId) {
    throw new Error("Environment variable Google Sheets belum lengkap.");
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"]
  });

  const sheets = google.sheets({ version: "v4", auth });
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range
  });

  const rows = response.data.values || [];

  // Baris pertama adalah header, lewati
  return rows.slice(1).map((cols) => ({
    judul: (cols[0] || "").trim(),
    penulis: (cols[1] || "").trim(),
    genre: (cols[2] || "").trim(),
    penerbit: (cols[3] || "").trim(),
    tahun: (cols[4] || "").trim(),
    bahasa: (cols[5] || "").trim(),      // ← kolom baru
    sinopsis: (cols[6] || "").trim()    // ← kolom sinopsis
  }));
}
