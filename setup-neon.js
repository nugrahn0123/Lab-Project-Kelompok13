#!/usr/bin/env node
// setup-neon.js — jalankan SEKALI sebelum docker-compose up
// Membuat semua schema di Neon dan memverifikasi koneksi
// Cara pakai: node setup-neon.js
// Pastikan DATABASE_URL sudah ada di .env di folder ini

require("dotenv").config();
const { Pool } = require("pg");

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("ERROR: DATABASE_URL tidak ditemukan. Buat file .env dulu.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  console.log("Menghubungkan ke Neon PostgreSQL...");
  const client = await pool.connect();
  try {
    // Test koneksi
    const { rows } = await client.query("SELECT version()");
    console.log("✓ Terhubung:", rows[0].version.split(" ").slice(0, 2).join(" "));

    // Buat semua schema
    const schemas = ["event_db", "ticket_db", "payment_db", "notification_db"];
    for (const schema of schemas) {
      await client.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
      console.log(`✓ Schema ${schema} siap`);
    }

    // Verifikasi schema tersedia
    const { rows: schemaRows } = await client.query(`
      SELECT schema_name FROM information_schema.schemata
      WHERE schema_name = ANY($1)
      ORDER BY schema_name
    `, [schemas]);
    console.log(`\n✓ ${schemaRows.length}/4 schema ditemukan di database`);

    console.log(`
========================================
Setup Neon selesai!

Langkah selanjutnya:
  docker-compose up --build

Semua service akan:
  1. Connect ke Neon (schema masing-masing)
  2. Jalankan migrasi CREATE TABLE
  3. Seed 54 konser Makassar (event-service)
  4. Siap menerima request di http://localhost:8080
========================================`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(e => {
  console.error("Setup gagal:", e.message);
  process.exit(1);
});
