// Lapisan 1 — Smoke Test: pastikan tiap layanan hidup & jujur
// Jalankan: BASE=http://localhost:8080 node --test tests/smoke.test.js
// (atau tanpa BASE jika default 8080 sudah benar)

const { test } = require("node:test");
const assert = require("node:assert/strict");

const BASE = process.env.BASE || "http://localhost:8080";

// ── Gateway ──────────────────────────────────────────────────────────────────

test("GET /health — gateway hidup → 200", async () => {
  const res = await fetch(`${BASE}/health`);
  assert.equal(res.status, 200);
});

// ── Event Service ─────────────────────────────────────────────────────────────

test("GET /events — daftar konser → 200 + array .data", async () => {
  const res = await fetch(`${BASE}/events`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(Array.isArray(body.data), "respons harus memiliki field .data berupa array");
});

test("GET /events/34 — event Fiersa Besari ada → 200", async () => {
  const res = await fetch(`${BASE}/events/34`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(body.kursi_tersisa !== undefined, "harus ada field kursi_tersisa");
});

test("GET /events/9999 — event tidak ada → 404", async () => {
  const res = await fetch(`${BASE}/events/9999`);
  assert.equal(res.status, 404);
});

// ── Lock / Ticket Service (POST /events/:id/lock via gateway) ─────────────────
// Nginx /events → event_cluster; ticket-service menangani endpoint ini di port 3002.
// Jika routing nginx belum diarahkan ke ticket_cluster untuk POST lock,
// test ini akan mengembalikan 404 — temuan routing yang perlu diperbaiki.

test("POST /events/34/lock — sah (qty + userId) → 201", async () => {
  const res = await fetch(`${BASE}/events/34/lock`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ qty: 1, userId: 999, hargaSatuan: 120000 }),
  });
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.ok(body.pesananId, "respons harus punya pesananId");
  assert.equal(body.status, "menunggu_pembayaran");
});

test("POST /events/34/lock — tanpa qty → 400", async () => {
  const res = await fetch(`${BASE}/events/34/lock`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: 1 }),
  });
  assert.equal(res.status, 400);
});

test("POST /events/34/lock — tanpa userId → 400", async () => {
  const res = await fetch(`${BASE}/events/34/lock`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ qty: 1 }),
  });
  assert.equal(res.status, 400);
});

// ── Payment Service ───────────────────────────────────────────────────────────

test("POST /payments — tanpa body → 400", async () => {
  const res = await fetch(`${BASE}/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  assert.equal(res.status, 400);
});

test("POST /payments — metode tidak valid → 400", async () => {
  const res = await fetch(`${BASE}/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pesananId: 1, userId: 1, jumlah: 120000, metode: "kripto" }),
  });
  assert.equal(res.status, 400);
});

// ── Notification Service ──────────────────────────────────────────────────────

test("POST /notifications — sah → 202", async () => {
  const res = await fetch(`${BASE}/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: 1,
      jenis: "tiket_dipesan",
      saluran: "email",
      payload: { eventId: 34 },
    }),
  });
  assert.equal(res.status, 202);
});

test("POST /notifications — tanpa userId → 400", async () => {
  const res = await fetch(`${BASE}/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jenis: "tiket_dipesan" }),
  });
  assert.equal(res.status, 400);
});

test("POST /notifications — jenis tidak valid → 400", async () => {
  const res = await fetch(`${BASE}/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: 1, jenis: "promo_besar_besaran" }),
  });
  assert.equal(res.status, 400);
});

// ── Ticket Service ────────────────────────────────────────────────────────────

test("GET /tickets — daftar tiket → 200 + array .data", async () => {
  const res = await fetch(`${BASE}/tickets`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(Array.isArray(body.data), "respons harus memiliki field .data berupa array");
});
