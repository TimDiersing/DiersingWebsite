// app.js
const express = require('express');
const path = require('path');
const { engine } = require('express-handlebars');
const pool = require('./db');
const bcrypt = require('bcrypt');
// const session = require('express-session');
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
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use((req, res, next) => {
  res.locals.fullName = "Bob Diersing";
  res.locals.phone = "949.683.1958";
  res.locals.email = "bobdiersing@firstteam.com";
  res.locals.currentYear = new Date().getFullYear();
  next();
});

// ROUTES
// Home route
app.get('/', async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const soldHomes = await client.query('SELECT * FROM soldHomes');
    const testimonials = await client.query('SELECT * FROM testimonials');

    res.render('home', {
      pageTitle: 'Bob Diesing',
      heroText: 'Find Your Perfect Home',
      soldHomes: soldHomes.rows,
      testimonials: testimonials.rows
    });

  } catch (err) {
    console.error('Error fecthing sold homes:', err);
    return res.status(500).json({ error: 'Database error' });

  } finally {
    if (client) {
      client.release();
    }
  }
});

// Sold Homes route
app.get('/soldHomes', async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const soldHomes = await client.query('SELECT * FROM soldHomes');
    res.render('soldHomes', {
      pageTitle: 'soldHomes',
      soldHomes: soldHomes.rows
    });

  } catch (err) {
    console.error('Error fecthing sold homes:', err);
    return res.status(500).json({ error: 'Database error' });

  } finally {
    if (client) {
      client.release();
    }
  }
});

// Single listing route
app.get('/listing/:id', async (req, res) => {
  const listingId = parseInt(req.params.id, 10);

  let client;
  try {
    client = await pool.connect();
    const listing = await client.query('SELECT * FROM soldHomes WHERE id = $1', [listingId]);
    res.render('listing', {
      pageTitle: listing.rows[0].title,
      listing: listing.rows[0]
    });

  } catch (err) {
    console.error('Error fetching listing', err);
    return res.status(500).json({ error: 'Database error' });

  } finally {
    if (client) {
      client.release();
    }
  }
});

// Profile route
app.get('/profile', async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const dbData = await client.query('SELECT * FROM testimonials');
    res.render('profile', {
      pageTitle: 'Profile - Bob Diersing',
      testimonials: dbData.rows,
    });
  } catch (err) {
    console.error('Error fetching testimonials', err);
    res.status(500).json({ error: 'Database error' });

  } finally {
    if (client) {
      client.release();
    }
  }
}); 

// Referals route
app.get('/referals', async (req, res) => {
  let client;

  try {
    client = await pool.connect();
    const dbData = await client.query('SELECT * FROM testimonials');
    res.render('referals', {
      pageTitle: 'Testimonals - Bob Diersing',
      testimonials: dbData.rows
    })
  } catch (err) {
    console.error('Error fetching testimonilas', err);

  } finally {
    if (client) {
      client.release();
    }
  }
}); 

// Contact route
app.get('/contact', (req, res) => {
  res.render('contact', {
    pageTitle: 'Contact - Bob Diersing'
  });
}); 

// const adminRouter = require('./routes/admin');
// app.use('/admin', adminRouter);

// Start the server
const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

const shutdown = async () => {
  console.log('Shutting down server');

  server.close(async (err) => {
    if (err) {
      console.error('Error closing server:', err);
      process.exit(1);
    }
    
    try {
      await pool.end();
      console.log('Database pool closed.');
      process.exit(0);
    } catch (err) {
      console.error('Error closing database pool', err);
      process.exit(1);
    }
  });
  
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
