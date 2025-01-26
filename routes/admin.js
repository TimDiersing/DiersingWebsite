const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const db = require('../db');
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
  res.render('adminLogin', {
    pageTitle: 'Admin Login',
    layout: 'admin',
  });
});
  
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const admin = await db.getAdmin(username);
        if (admin && await bcrypt.compare(password, admin.password)) {
            req.session.isAdmin = true;
            return res.redirect('/admin/dashboard');
        } else {
          res.status(401).render('adminLogin', { error: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).send("error logging in");
        console.error("error: ", error);
    }
});
  
// Add listing page
router.get('/add-listing', isAdmin, (req, res) => {
  res.render('addListing');
});

router.post('/add-listing', isAdmin, async (req, res) => {
  const { title, price, description } = req.body;
  try {
    await db.addListing({ title, price, description });
    res.redirect('/admin/dashboard'); // Redirect to the homepage or admin dashboard
  } catch (error) {
    res.status(500).send("error posting listing");
    console.error("error: ", error);
  }
});

router.get('/dashboard', isAdmin, (req, res) => {
  const query = `SELECT * FROM soldHomes`;
  
  db.db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error fetching sold homes:', err.message);
      return res.status(500).send('An error occurred while fetching sold homes.');
    }

    res.render('adminDashboard', {
      pageTitle: 'Admin Dashboard',
      soldHomes: rows,
      layout: 'admin',
    });
  });
});

router.delete('/listing/:id', isAdmin, (req, res) => {
  db.db.run(`DELETE from soldHomes WHERE id = ?`, [req.params.id], (err) => {
    if (err) {
      console.error(err);
    } else if (this.changes === 0) {
      console.log('listing not found');
    } else {
      console.log('listing deleted id: ', req.params.id);
    }
  })
});
  
module.exports = router;