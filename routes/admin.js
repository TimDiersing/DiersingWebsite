const express = require('express');
const pool = require('../db');
const router = express.Router();

// Middleware to check admin authentication
function isAdmin(req, res, next) {
  console.log(req.session);
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
    if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
        req.session.isAdmin = true;
        res.redirect('/admin/dashboard');
    }
});

router.get('/dashboard', isAdmin, async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const dbData = await client.query('SELECT * FROM soldHomes');

    res.render('adminDashboard', {
      pageTitle: 'Admin Dashboard',
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

// router.delete('/listing/:id', isAdmin, (req, res) => {
//   db.db.run(`DELETE from soldHomes WHERE id = ?`, [req.params.id], (err) => {
//     if (err) {
//       console.error(err);
//     } else if (this.changes === 0) {
//       console.log('listing not found');
//     } else {
//       console.log('listing deleted id: ', req.params.id);
//     }
//   })
// });
  
module.exports = router;