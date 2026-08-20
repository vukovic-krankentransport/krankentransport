const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const DATA_FILE = path.join(__dirname, 'baza_podataka.json');

// Inicijalna struktura baze
let baza = {
    voznje: [],
    poruke: []
};

// Učitavanje baze sa diska
if (fs.existsSync(DATA_FILE)) {
    try {
        const raw = fs.readFileSync(DATA_FILE, 'utf8');
        baza = JSON.parse(raw);
        if (!baza.voznje) baza.voznje = [];
        if (!baza.poruke) baza.poruke = [];
    } catch (e) {
        console.error("Greška pri čitanju baze:", e);
    }
}

function sacuvajBazu() {
    fs.writeFileSync(DATA_FILE, JSON.stringify(baza, null, 2), 'utf8');
}

// Pomocna funkcija za dobijanje danasnjeg datuma u YYYY-MM-DD formatu
function getDanasnjiDatum() {
    return new Date().toISOString().split('T')[0];
}

// ---------------- API RUTE ----------------

// GET Vožnje (Aktivne na radnoj tabli)
app.get('/api/voznje', (req, res) => {
    // Vraćaju se samo vožnje koje nisu "Erledigt" ili su kreirane danas
    const danas = getDanasnjiDatum();
    const aktivne = baza.voznje.filter(v => v.status !== 'Erledigt' || v.datum === danas);
    res.json(aktivne);
});

// POST Nova vožnja
app.post('/api/voznje', (req, res) => {
    const novaVoznja = {
        id: baza.voznje.length + 1,
        vozilo: req.body.vozilo,
        pacijent: req.body.pacijent,
        kasa: req.body.kasa || '',
        datum: req.body.datum || getDanasnjiDatum(),
        vreme: req.body.vreme || '',
        tipTransporta: req.body.tipTransporta || 'Sitzend',
        adresaPolazak: req.body.adresaPolazak,
        adresaOdrediste: req.body.adresaOdrediste || '',
        infekcija: req.body.infekcija || 'NEIN',
        napomena: req.body.napomena || '',
        status: 'Offen',
        kreirano: new Date().toISOString()
    };
    baza.voznje.push(novaVoznja);
    sacuvajBazu();
    res.json({ success: true, voznja: novaVoznja });
});

// POST Promena statusa
app.post('/api/status', (req, res) => {
    const { id, status } = req.body;
    const voznja = baza.voznje.find(v => v.id === parseInt(id));
    if (voznja) {
        voznja.status = status;
        sacuvajBazu();
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Vožnja nije pronađena' });
    }
});

// GET Poruke (Aktivni dnevni chat)
app.get('/api/poruke', (req, res) => {
    const danas = getDanasnjiDatum();
    // Vraćaju se samo današnje poruke za aktivni chat
    const danasnjePoruke = baza.poruke.filter(p => p.datum === danas);
    res.json(danasnjePoruke);
});

// POST Nova poruka
app.post('/api/poruke', (req, res) => {
    const sada = new Date();
    const novaPoruka = {
        id: baza.poruke.length + 1,
        posiljalac: req.body.posiljalac,
        vozilo: req.body.vozilo,
        tekst: req.body.tekst,
        datum: req.body.datum || getDanasnjiDatum(),
        vreme: sada.toTimeString().split(' ')[0].substring(0, 5),
        timestamp: sada.toISOString()
    };
    baza.poruke.push(novaPoruka);
    sacuvajBazu();
    res.json({ success: true, poruka: novaPoruka });
});

// GET Historija (Arhiva vožnji i poruka po datumu)
app.get('/api/historija', (req, res) => {
    const { datum, vozilo } = req.query;

    let voznje = baza.voznje;
    let poruke = baza.poruke;

    if (datum) {
        voznje = voznje.filter(v => v.datum === datum);
        poruke = poruke.filter(p => p.datum === datum);
    }

    if (vozilo && vozilo !== 'Sva vozila') {
        voznje = voznje.filter(v => v.vozilo === vozilo);
        poruke = poruke.filter(p => p.vozilo === vozilo);
    }

    res.json({ voznje, poruke });
});

// GET Backup cele baze
app.get('/api/backup', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=backup_krankentransport_${getDanasnjiDatum()}.json`);
    res.send(JSON.stringify(baza, null, 2));
});

// Reset za novi dan
app.post('/api/reset', (req, res) => {
    // Svi nedovršeni zadaci se prebacuju u Erledigt ili se osvežava prikaz
    sacuvajBazu();
    res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server pokrenut na portu ${PORT}`);
});
