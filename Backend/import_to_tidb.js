const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// ==========================================
// TARGET: TiDB Cloud (from .env)
// ==========================================
const targetConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || "4000"),
    ssl: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
    },
    multipleStatements: true // PENTING: Untuk menjalankan banyak query sekaligus
};

async function startImport() {
    const backupFile = path.join(__dirname, 'tidb_full_backup.sql');
    
    if (!fs.existsSync(backupFile)) {
        console.error('❌ Error: File tidb_full_backup.sql tidak ditemukan!');
        process.exit(1);
    }

    console.log('🚀 [START] Automatic Import to TiDB Cloud...');
    console.log('------------------------------------------');
    console.log(`📍 File: ${backupFile}`);
    console.log(`🌐 Target: ${process.env.DB_HOST}`);

    let conn;
    try {
        const sql = fs.readFileSync(backupFile, 'utf8');
        
        console.log('⏳ Menghubungkan ke TiDB...');
        conn = await mysql.createConnection(targetConfig);
        console.log('✅ Terhubung!');

        console.log('⏳ Menjalankan script backup (ini mungkin memakan waktu)...');
        
        // Menjalankan seluruh isi file SQL
        await conn.query(sql);
        
        console.log('------------------------------------------');
        console.log('🎉 [SUCCESS] DATA BERHASIL DI-IMPORT KE TIDB!');
        console.log('Sekarang Bapak bisa cek dashboard Vercel / Website Bapak.');

    } catch (error) {
        console.error('\n❌ [ERROR] Import Gagal:');
        console.error(error.message);
        
        if (error.code === 'ETIMEDOUT') {
            console.log('\n💡 TIPS: Pastikan IP Address Anda sudah masuk di WHITELIST TiDB Cloud (Console -> Connect -> IP Whitelist).');
        }
    } finally {
        if (conn) await conn.end();
        process.exit();
    }
}

startImport();
