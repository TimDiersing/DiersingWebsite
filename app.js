// app.js
const express = require('express');
const path = require('path');
const { engine } = require('express-handlebars');
const db = require('./db');
const bcrypt = require('bcrypt');
const session = require('express-session');
const sqlite3 = require('sqlite3');
const favicon = require('serve-favicon');
require('dotenv').config();
 
const app = express();
const PORT = process.env.PORT || 3000;

// Set up Handlebars
app.engine('handlebars', engine({
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'views', 'layouts'),
}));

app.set('view engine', 'handlebars');
// app.set('veiws', path.join(__dirname, 'veiws'));

// MIDDLEWEAR 
// Serve static files (CSS, images)
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use((req, res, next) => {
  res.locals.fullName = "Bob Diersing";
  res.locals.phone = "949.683.1958";
  res.locals.email = "bobdiersing@firstteam.com";
  res.locals.currentYear = new Date().getFullYear();
  next();
});

app.use(session({
  secret: process.env.DB_SECRET,
  resave: false,
  saveUninitialized: true,
}));

// ROUTES
// Home route
app.get('/', (req, res) => {
  const query = `SELECT * FROM soldHomes ORDER BY id DESC LIMIT 4`;

  db.db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error fetching sold homes:', err.message);
      return res.status(500).send('An error occurred while fetching sold homes.');
    } else {
      res.render('home', {
        pageTitle: 'Bob Diesing',
        heroText: 'Find Your Perfect Home',
        soldHomes: rows
      });
    }
  });

});

// Sold Homes route
app.get('/soldHomes', (req, res) => {
  const query = `SELECT * FROM soldHomes`;

  db.db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error fetching sold homes:', err.message);
      return res.status(500).send('An error occurred while fetching sold homes.');
    }

    res.render('soldHomes', {
      pageTitle: 'Sold Homes - Bob Diersing',
      soldHomes: rows
    });
  });
});

// Single listing route
app.get('/listing/:id', (req, res) => {
  const listingId = parseInt(req.params.id, 10);
  const query = `SELECT * FROM soldHomes WHERE id = ?`;

  db.db.get(query, [listingId], (err, row) => {
    if (err) {
      console.error('Error fetching listing:', err.message);
      return res.status(500).send('An error occurred while fetching the listing.');
    }
    if (!row) {
      return res.status(404).send('Listing not found');
    }

    res.render('listing', {
      pageTitle: row.title,
      listing: row
    });
  });
});

// Profile route
app.get('/profile', (req, res) => {
  res.render('profile', {
    pageTitle: 'Profile - Bob Diersing'
  });
}); 

// Referals route
app.get('/referals', (req, res) => {
  res.render('referals', {
    pageTitle: 'Testimonals - Bob Diersing'
  });
}); 

// Contact route
app.get('/contact', (req, res) => {
  res.render('contact', {
    pageTitle: 'Contact - Bob Diersing'
  });
}); 

const adminRouter = require('./routes/admin');
app.use('/admin', adminRouter);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

function shutdown() {
  db.db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database closed');
      process.exit(0);
    }
  });
}