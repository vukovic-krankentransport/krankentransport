const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

let voznje = [];

// Dobijanje svih aktivnih vožnji
app.get('/api/voznje', (req, res) => {
    res.json(voznje);
});

// Dodavanje nove vožnje od strane dispečera
app.post('/api/voznje', (req, res) => {
    const novaVoznja = {
        id: Date.now(),
        vozilo: req.body.vozilo, // Vozilo 1 do Vozilo 10
        pacijent: req.body.pacijent,
        adresa: req.body.adresa,
        napomena: req.body.napomena || '',
        status: 'Dodijeljeno',
        datum: new Date().toLocaleDateString()
    };
    voznje.push(novaVoznja);
    res.json({ success: true, voznja: novaVoznja });
});

// Ažuriranje statusa vožnje od strane vozača
app.post('/api/status', (req, res) => {
    const { id, status } = req.body;
    const voznja = voznje.find(v => v.id === id);
    if (voznja) {
        voznja.status = status;
        res.json({ success: true });
    } else {
        res.status(404).json({ error: "Vožnja nije pronađena" });
    }
});

// Resetovanje / Novi dan (Brisanje vožnji)
app.post('/api/reset', (req, res) => {
    voznje = [];
    res.json({ success: true });
});

app.listen(PORT, () => console.log(`Server radi na portu ${PORT}`));
