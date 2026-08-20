const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const DATA_FILE = path.join(__dirname, 'data.json');

function readData() {
    if (!fs.existsSync(DATA_FILE)) {
        return { voznje: [], poruke: [] };
    }
    const raw = fs.readFileSync(DATA_FILE);
    return JSON.parse(raw);
}

function saveData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Get Vožnje
app.get('/api/voznje', (req, res) => {
    const data = readData();
    res.json(data.voznje);
});

// Dodaj / Izmeni Vožnju
app.post('/api/voznje', (req, res) => {
    const data = readData();
    const novaVoznja = req.body;

    if (!novaVoznja.id) {
        novaVoznja.id = Date.now().toString().slice(-4);
    }

    const index = data.voznje.findIndex(v => v.id === novaVoznja.id);
    if (index !== -1) {
        data.voznje[index] = { ...data.voznje[index], ...novaVoznja };
    } else {
        novaVoznja.status = novaVoznja.status || 'Status 1';
        data.voznje.push(novaVoznja);
    }

    saveData(data);
    io.emit('update', data);
    res.json({ success: true, voznja: novaVoznja });
});

// Izmena Statusa
app.post('/api/status', (req, res) => {
    const { id, status } = req.body;
    const data = readData();
    const voznja = data.voznje.find(v => v.id === id);
    if (voznja) {
        voznja.status = status;
        saveData(data);
        io.emit('update', data);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Nije pronadjeno' });
    }
});

// Poruke
app.get('/api/poruke', (req, res) => {
    const data = readData();
    res.json(data.poruke);
});

app.post('/api/poruke', (req, res) => {
    const data = readData();
    const { posiljalac, vozilo, tekst } = req.body;
    const poruka = {
        id: Date.now(),
        posiljalac,
        vozilo,
        tekst,
        vreme: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    data.poruke.push(poruka);
    saveData(data);
    io.emit('nova_poruka', poruka);
    res.json({ success: true });
});

server.listen(3000, () => {
    console.log('Server radi na portu 3000');
});
