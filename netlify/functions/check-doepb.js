import fetch from "node-fetch";
import pdf from "pdf-parse";
import fs from "fs/promises";
import path from "path";
import nodemailer from "nodemailer";

const DOE_LIST_URL = "https://auniao.pb.gov.br/doe";
const DATA_DIR = "/tmp"; // Netlify temp
const HISTORY_FILE = "data/history.json"; // persisted via included_files

function normalize(s) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

async function loadHistory() {
  try {
    return JSON.parse(await fs.readFile(HISTORY_FILE, "utf-8"));
  } catch {
    return { lastSeenHref: null, hits: [] };
  }
}
async function saveHistory(h) {
  await fs.mkdir(path.dirname(HISTORY_FILE), { recursive: true });
  await fs.writeFile(HISTORY_FILE, JSON.stringify(h, null, 2));
}

function parsePdfHrefFromHtml(html) {
  // encontra o primeiro link para "Diário Oficial DD-MM-YYYY Portal.pdf"
  const m = html.match(/href="([^"]+diario-oficial-\d{2}-\d{2}-\d{4}-portal\.pdf)"/i);
  return m ? new URL(m[1], DOE_LIST_URL).href : null;
}

async function fetchLatestPdfUrl() {
  const res = await fetch(DOE_LIST_URL, { timeout: 20000 });
  const html = await res.text();
  const href = parsePdfHrefFromHtml(html);
  if (!href) throw new Error("Não achei link do PDF na página do DOE.");
  return href;
}

async function downloadPdf(url) {
  const r = await fetch(url, { timeout: 60000 });
  if (!r.ok) throw new Error(`Falha ao baixar PDF: ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  const file = path.join(DATA_DIR, "doe.pdf");
  await fs.writeFile(file, buf);
  return file;
}

async function searchTermsInPdf(file, terms) {
  const data = await pdf(await fs.readFile(file));
  const textNorm = normalize(data.text);
  const hits = [];
  for (const t of terms) {
    const tNorm = normalize(t);
    if (textNorm.includes(tNorm)) hits.push(t);
  }
  return hits;
}

async function notifyEmail({ subject, html }) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_TO, MAIL_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !MAIL_TO) return;
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: false,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });
  await transporter.sendMail({ from: MAIL_FROM || SMTP_USER, to: MAIL_TO, subject, html });
}

async function notifyTelegram({ text }) {
  const { TG_BOT_TOKEN, TG_CHAT_ID } = process.env;
  if (!TG_BOT_TOKEN || !TG_CHAT_ID) return;
  const url = `https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`;
  await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: TG_CHAT_ID, text, disable_web_page_preview: true })
  });
}

export const handler = async () => {
  try {
    const TERMS = (process.env.TERMS || "").split(",").map(s => s.trim()).filter(Boolean);
    if (!TERMS.length) return { statusCode: 200, body: "Sem termos configurados." };

    const hist = await loadHistory();
    const pdfUrl = await fetchLatestPdfUrl();

    if (hist.lastSeenHref === pdfUrl) {
      return { statusCode: 200, body: "Sem edição nova." };
    }

    // nova edição
    const file = await downloadPdf(pdfUrl);
    const hits = await searchTermsInPdf(file, TERMS);

    hist.lastSeenHref = pdfUrl;
    if (hits.length) {
      const subject = `DOE/PB: encontrei ${hits.join(", ")} 🎯`;
      const html =
        `<p>Encontrei no <a href="${pdfUrl}">DOE/PB de hoje</a> os termos: <b>${hits.join(", ")}</b>.</p>`;
      await notifyEmail({ subject, html });
      await notifyTelegram({ text: `DOE/PB ✅ ${hits.join(", ")}\n${pdfUrl}` });
      hist.hits.unshift({ when: new Date().toISOString(), pdfUrl, hits });
      hist.hits = hist.hits.slice(0, 100);
    }
    await saveHistory(hist);
    return { statusCode: 200, body: `OK. PDF: ${pdfUrl} | hits: ${hits.length}` };
  } catch (e) {
    console.error(e);
    return { statusCode: 500, body: "Erro: " + e.message };
  }
};
