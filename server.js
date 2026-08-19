const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// Povezivanje sa SQLite bazom podataka
const db = new sqlite3.Database('./baza.db', (err) => {
    if (err) console.error("Greška pri otvaranju baze:", err.message);
    else console.log("Povezan sa SQLite bazom podataka.");
});

// Kreiranje tabele sa novim kolona (datum, tipTransporta)
db.run(`CREATE TABLE IF NOT EXISTS voznje (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vozilo TEXT,
    pacijent TEXT,
    kasa TEXT,
    vreme TEXT,
    datum TEXT,
    tipTransporta TEXT,
    adresaPolazak TEXT,
    adresaOdrediste TEXT,
    infekcija TEXT,
    napomena TEXT,
    status TEXT,
    aktivan INTEGER DEFAULT 1
)`);

// Dobijanje svih AKTIVNIH vožnji (za radnu tablu uživo)
app.get('/api/voznje', (req, res) => {
    db.all(`SELECT * FROM voznje WHERE aktivan = 1 ORDER BY id ASC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Dobijanje ISTORIJE / ARHIVE vožnji (sa filterima za datum i vozilo)
app.get('/api/historija', (req, res) => {
    const { datum, vozilo } = req.query;
    let query = `SELECT * FROM voznje WHERE 1=1`;
    let params = [];

    if (datum) {
        query += ` AND datum = ?`;
        params.push(datum);
    }
    if (vozilo && vozilo !== 'Sva vozila') {
        query += ` AND vozilo = ?`;
        params.push(vozilo);
    }

    query += ` ORDER BY id ASC`;

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Dodavanje nove vožnje od strane dispečera
app.post('/api/voznje', (req, res) => {
    const { vozilo, pacijent, kasa, vreme, datum, tipTransporta, adresaPolazak, adresaOdrediste, infekcija, napomena } = req.body;
    
    // Ako datum nije prosleđen, uzima se današnji
    const unosDatum = datum || new Date().toISOString().split('T')[0];

    const sql = `INSERT INTO voznje (vozilo, pacijent, kasa, vreme, datum, tipTransporta, adresaPolazak, adresaOdrediste, infekcija, napomena, status, aktivan)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Prihvaćeno', 1)`;
    
    db.run(sql, [vozilo, pacijent, kasa, vreme, unosDatum, tipTransporta || 'Sedeći', adresaPolazak, adresaOdrediste, infekcija, napomena || ''], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: this.lastID });
    });
});

// Ažuriranje statusa vožnje od strane vozača
app.post('/api/status', (req, res) => {
    const { id, status } = req.body;
    
    // Ako je status "Završeno", nalog se sklanja sa radne table vozača, ali ostaje u arhivu/bazi
    const aktivan = (status === 'Završeno') ? 0 : 1;

    db.run(`UPDATE voznje SET status = ?, aktivan = ? WHERE id = ?`, [status, aktivan, id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Resetovanje / Novi dan
app.post('/api/reset', (req, res) => {
    db.run(`UPDATE voznje SET aktivan = 0 WHERE aktivan = 1`, [], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.listen(PORT, () => console.log(`Server radi na portu ${PORT}`));
