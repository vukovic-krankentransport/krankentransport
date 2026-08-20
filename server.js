const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

const db = new sqlite3.Database('./baza.db', (err) => {
    if (err) console.error("Fehler beim Öffnen der Datenbank:", err.message);
    else console.log("Verbunden mit der SQLite-Datenbank.");
});

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

app.get('/api/voznje', (req, res) => {
    db.all(`SELECT * FROM voznje WHERE aktivan = 1 ORDER BY id ASC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

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

app.post('/api/voznje', (req, res) => {
    const { vozilo, pacijent, kasa, vreme, datum, tipTransporta, adresaPolazak, adresaOdrediste, infekcija, napomena } = req.body;
    const unosDatum = datum || new Date().toISOString().split('T')[0];

    const sql = `INSERT INTO voznje (vozilo, pacijent, kasa, vreme, datum, tipTransporta, adresaPolazak, adresaOdrediste, infekcija, napomena, status, aktivan)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Erteilt', 1)`;
    
    db.run(sql, [vozilo, pacijent, kasa, vreme, unosDatum, tipTransporta || 'Sitzend', adresaPolazak, adresaOdrediste, infekcija, napomena || ''], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: this.lastID });
    });
});

app.post('/api/status', (req, res) => {
    const { id, status } = req.body;
    const aktivan = (status === 'Erledigt') ? 0 : 1;

    db.run(`UPDATE voznje SET status = ?, aktivan = ? WHERE id = ?`, [status, aktivan, id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.post('/api/reset', (req, res) => {
    db.run(`UPDATE voznje SET aktivan = 0 WHERE aktivan = 1`, [], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));
