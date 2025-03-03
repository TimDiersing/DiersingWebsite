const express = require('express');
const pool = require('../db');
const router = express.Router();

// Middleware to check admin authentication
function isAdmin(req, res, next) {
  if (req.session.isAdmin) {
    return next();
  } else {
    res.redirect('/admin/login');
  }
}

// Admin login page
router.get('/login', (req, res) => {
  res.render('admin/adminLogin', {
    pageTitle: 'Admin Login',
    layout: 'admin',
  });
});
  
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
      req.session.isAdmin = true;
      res.redirect('/admin/dashboard');
    } else {
      res.redirect('/admin/login');
    }
});

router.get('/dashboard', isAdmin, async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const dbData = await client.query('SELECT * FROM soldHomes');

    res.render('admin/adminDashboard', {
      pageTitle: 'Admin Dashboard',
      layout: 'admin',
      soldHomes: dbData.rows
    });

  } catch (err) {
    console.error('Error fetching data', err)
    res.status(500).json({ Error: 'Database error' });

  } finally {
    if (client) {
      client.release();
    }
  }
});

router.post('/addListing', isAdmin, async (req, res) => {
  let client;
  const { address, title, image, story } = req.body;

  try {
    client = await pool.connect();
    await client.query('INSERT INTO soldHomes (address, title, image, story) VALUES ($1, $2, $3, $4)',
       [address, title, 'sdfkjgh', story]);
    res.redirect('/admin/dashboard');

  } catch (err) {
    console.error('Error adding data', err);
    res.status(500).json({ Error: 'Database error' });

  } finally {
    if (client) {
      client.release();
    }
  }
});

router.get('/listing/:id', isAdmin, async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const dbData = await client.query('SELECT * FROM soldHomes WHERE id = $1', [req.params.id]);

    res.render("admin/adminListing", {
      pageTitle: 'listing - ' + dbData.rows[0].id,
      layout: 'admin',
      listing: dbData.rows[0]
    });

  } catch (err) {
    console.error('Error fecthing data', err);
    res.status(500).json({ Error: 'Database error' });

  } finally {
    if (client) {
      client.release();
    }
  }
});

router.post('/listing/:id', isAdmin, async (req, res) => {
  const { address, title, story } = req.body;

  let client;
  try {
    client = await pool.connect();
    await client.query('UPDATE soldHomes SET address = $1, title = $2, story = $3 WHERE id = $4', 
                        [address, title, story, req.params.id]);
    res.redirect('/admin/dashboard');

  } catch (err) {
    console.error('Error updataing listing', err);
    res.status(500).json({ Error: 'Database error' });
  } finally {
    client.release();
  }
});

router.delete('/listing/:id', isAdmin, async (req, res) => {
  let client;
  const listingId = parseInt(req.params.id);
  try {
    client = await pool.connect();
    await client.query('DELETE FROM soldHomes WHERE id = $1', [listingId]);
    res.redirect('/admin/dashboard');

  } catch (err) {
    console.error('Error deleting from db', err);
    res.status(500).json({ Error: 'Database error' });
  } finally {
    client.release();
  }
});
  
module.exports = router;