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
      console.log("logged in");
      res.redirect('/admin/dashboard');
    } else {
      console.log("loggin failed");
      res.redirect('/admin/login');
    }
});

router.get('/dashboard', isAdmin, async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const dbData = await client.query('SELECT * FROM listings');

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
    await client.query('INSERT INTO listings (address, title, image, story) VALUES ($1, $2, $3, $4)',
       [address, title, '/images/viaAguliaHouse.jpg', story]);
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
    const dbData = await client.query('SELECT * FROM listings WHERE id = $1', [req.params.id]);

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
  const { image, title, address, story, soldPrice, bedBaths, sqft, description, type } = req.body;

  let client;
  try {
    client = await pool.connect();
    await client.query('UPDATE listings SET image = $1, title = $2, address = $3,' + 
                       'story = $4, soldPrice = $5, bedBaths = $6, sqft = $7, description = $8, type = $9 WHERE id = $10', 
                        [image, title || 'title', address || 'address', story || 'story', soldPrice || 0, bedBaths || 'bed baths', sqft || 0, description || 'description', type || 'sold', req.params.id]);
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
    await client.query('DELETE FROM listings WHERE id = $1', [listingId]);
    res.redirect('/dashboard');

  } catch (err) {
    console.error('Error deleting from db', err);
    res.status(500).json({ Error: 'Database error' });
  } finally {
    client.release();
  }
});
  
module.exports = router;