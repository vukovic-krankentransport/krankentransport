const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Povezivanje i kreiranje SQLite baze podataka
const db = new sqlite3.Database('./baza.db', (err) => {
    if (err) {
        console.error('Greška pri otvaranju baze:', err.message);
    } else {
        console.log('Povezan na SQLite bazu podataka.');
    }
});

// Kreiranje tabele za naloge ako ne postoji
db.run(`CREATE TABLE IF NOT EXISTS nalozi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pacijent TEXT,
    prijemnaAdresa TEXT,
    odredisteAdresa TEXT,
    datumVreme TEXT,
    tipPacijenta TEXT,
    infekcija TEXT,
    vozac TEXT,
    napomena TEXT,
    status TEXT
)`);

// Kreiranje novog naloga
app.post('/api/nalozi', (req, res) => {
    const { pacijent, prijemnaAdresa, odredisteAdresa, datumVreme, tipPacijenta, infekcija, vozac, napomena } = req.body;
    const sql = `INSERT INTO nalozi (pacijent, prijemnaAdresa, odredisteAdresa, datumVreme, tipPacijenta, infekcija, vozac, napomena, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [pacijent, prijemnaAdresa, odredisteAdresa, datumVreme, tipPacijenta || 'Sedeći', infekcija || 'Ne', vozac || 'Nedodeljen', napomena || '', 'Novi nalog'];

    db.run(sql, params, function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ id: this.lastID, message: 'Nalog sačuvan u bazi!' });
    });
});

// Preuzimanje svih naloga iz baze
app.get('/api/nalozi', (req, res) => {
    const sql = "SELECT * FROM nalozi ORDER BY id DESC";
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Promena statusa naloga
app.put('/api/nalozi/:id', (req, res) => {
    const { status } = req.body;
    const { id } = req.params;
    const sql = `UPDATE nalozi SET status = ? WHERE id = ?`;

    db.run(sql, [status, id], function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        console.log(`[BAZA AŽURIRANA] Nalog ID: ${id} promenio status u: "${status}"`);
        res.json({ message: 'Status uspesno izmenjen' });
    });
});

app.listen(PORT, () => {
    console.log(`Server radi na: http://localhost:${PORT}`);
});