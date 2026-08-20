// POST Nova vožnja
app.post('/api/voznje', (req, res) => {
    const novaVoznja = {
        id: baza.voznje.length + 1,
        vozilo: req.body.vozilo,
        pacijent: req.body.pacijent,
        datumRodjenja: req.body.datumRodjenja || '', // <-- DODATO POLJE
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
