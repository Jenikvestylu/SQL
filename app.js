// app.js - Hlavní soubor aplikace

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bodyParser = require('body-parser');

// Inicializace Express aplikace
const app = express();
const port = 3000;

// Nastavení middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

// Připojení k databázi
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('Chyba při připojení k databázi:', err.message);
  } else {
    console.log('Připojeno k SQLite databázi');
    
    // Vytvoření tabulky, pokud neexistuje
    db.run(`CREATE TABLE IF NOT EXISTS zaznamy (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kategorie TEXT NOT NULL,
      text TEXT NOT NULL
    )`, (err) => {
      if (err) {
        console.error('Chyba při vytváření tabulky:', err.message);
      } else {
        console.log('Tabulka zaznamy vytvořena nebo již existuje');
      }
    });
  }
});

// Zobrazení hlavní stránky se seznamem záznamů
app.get('/', (req, res) => {
  const kategorie = req.query.kategorie || '';
  const hledanyText = req.query.hledanyText || '';
  
  let sql = 'SELECT * FROM zaznamy WHERE 1=1';
  const params = [];
  
  if (kategorie) {
    sql += ' AND kategorie = ?';
    params.push(kategorie);
  }
  
  if (hledanyText) {
    sql += ' AND text LIKE ?';
    params.push(`%${hledanyText}%`);
  }
  
  // Nejdříve načteme všechny dostupné kategorie
  db.all('SELECT DISTINCT kategorie FROM zaznamy', [], (err, kategorie) => {
    if (err) {
      return res.status(500).send('Chyba při načítání kategorií: ' + err.message);
    }
    
    // Pak načteme záznamy podle filtrů
    db.all(sql, params, (err, zaznamy) => {
      if (err) {
        return res.status(500).send('Chyba při načítání záznamů: ' + err.message);
      }
      
      res.render('index', { 
        zaznamy: zaznamy, 
        dostupneKategorie: kategorie,
        vybranaKategorie: req.query.kategorie || '',
        hledanyText: req.query.hledanyText || ''
      });
    });
  });
});

// Přidání nového záznamu
app.post('/pridat', (req, res) => {
  const { kategorie, text } = req.body;
  
  if (!kategorie || !text) {
    return res.status(400).send('Kategorie a text jsou povinné položky');
  }
  
  const sql = 'INSERT INTO zaznamy (kategorie, text) VALUES (?, ?)';
  db.run(sql, [kategorie, text], function(err) {
    if (err) {
      return res.status(500).send('Chyba při ukládání záznamu: ' + err.message);
    }
    
    res.redirect('/');
  });
});

// Smazání záznamu
app.post('/smazat/:id', (req, res) => {
  const id = req.params.id;
  
  const sql = 'DELETE FROM zaznamy WHERE id = ?';
  db.run(sql, [id], function(err) {
    if (err) {
      return res.status(500).send('Chyba při mazání záznamu: ' + err.message);
    }
    
    res.redirect('/');
  });
});

// Spuštění serveru
app.listen(port, () => {
  console.log(`Server běží na http://localhost:${port}`);
});