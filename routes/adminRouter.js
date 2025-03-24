const express = require('express');
const pool = require('../db');
const axios = require('axios');
const path = require('path');
const multer = require('multer');
const fs = require('fs').promises;
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
    const { username, password, 'g-recaptcha-response': token} = req.body;

    if (!token) {
      res.redirect('/admin/login?error=missing_token');
    }

    const response = await axios.post(`https://www.google.com/recaptcha/api/siteverify`,
      new URLSearchParams({
        secret: process.env.CAP_SECRET,
        response: token,
      })
    );

    const {success, 'error-codes': capErrors } = response.data;

    if (success == true) {
      if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
        req.session.isAdmin = true;
        console.log("logged in");
        res.redirect('/admin/dashboard');
      } else {
        console.log("loggin failed");
        res.redirect('/admin/login');
      }
    } else {
      console.error("captcha failed", capErrors);
      res.redirect('/admin/login?error=captcha_failed');
    }
});

router.get('/dashboard', isAdmin, async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const soldListings = await client.query('SELECT * FROM listings WHERE type = $1 ORDER BY id DESC', ['sold']);
    const activeListings = await client.query('SELECT * FROM listings WHERE type = $1 ORDER BY id DESC', ['listed']);

    res.render('admin/adminDashboard', {
      pageTitle: 'Admin Dashboard',
      layout: 'admin',
      soldListings: soldListings.rows,
      activeListings: activeListings.rows,
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

// Configure storage options for Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Set the destination folder for uploaded files
    cb(null, 'public/images/listing_images');
  },
  filename: (req, file, cb) => {
    // Create a unique filename by prefixing with the current timestamp
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// Initialize Multer with the defined storage
const upload = multer({ storage: storage });

router.post('/addListing', isAdmin, upload.array("listingImages", 50), async (req, res) => {
  let client;

  const imgPaths = req.files.map(file => file.path.replace(/^public\\/, ''));
  const { title, address, shortAdress, story, price, beds, baths, sqft, description, type } = req.body;

  try {
    client = await pool.connect();
    req.listingID = await client.query('INSERT INTO listings (images, title, address, short_address, story, price, beds, baths, sqft, description, type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id',
      [imgPaths, title, address, shortAdress, story, price, beds, baths, sqft, description, type]);
      
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

async function deleteFiles(imagePaths) {
  const base = path.join(__dirname, '..', 'public');

  if (Array.isArray(imagePaths)) {
      const deletePromises = imagePaths.map((imagePath) => {
        const fullPath = path.join(base, imagePath);
        return fs.unlink(fullPath);
      });
    
      await Promise.all(deletePromises);
  } else {
    await fs.unlink(path.join(base, imagePaths));
  }
}

router.get('/listing/:id', isAdmin, async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const dbData = await client.query('SELECT * FROM listings WHERE id = $1', [req.params.id]);
    
    let imageCount;
    let listed = false;

    if (dbData.rows[0].images != null) {
      imageCount = dbData.rows[0].images.length - 1;
    }
    if (dbData.rows[0].type == 'listed') {
      listed = true;
    }

    res.render("admin/adminListing", {
      pageTitle: 'listing - ' + dbData.rows[0].id,
      layout: 'admin',
      listing: dbData.rows[0],
      imageCount: imageCount,
      isListed: listed,
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

router.post('/listing/:id', isAdmin, upload.any(), async (req, res) => {
  const { title, address, shortAddress, story, price, beds, baths, sqft, description, type, imageThumbnail } = req.body;

  let imgPaths;
  if (req.files.length > 0) {
    imgPaths = req.files.map(file => file.path.replace(/^public\\/, ''));
  }

  let client;
  try {
    client = await pool.connect();
    await client.query('UPDATE listings SET title = $1, address = $2, short_address = $3, story = $4, price = $5, beds = $6, baths = $7, sqft = $8, description = $9, type = $10, thumbnail_index = $11 WHERE id = $12', 
                        [title || 'title', address || 'address', shortAddress || '', story || '', price || 0, beds, baths, sqft || 0, description || '', type, imageThumbnail, req.params.id]);

    // If user updated images
    if (imgPaths) {
      const oldImagePaths = await client.query('SELECT images FROM listings WHERE id = $1', [req.params.id]);
      // If listing had previous images
      if (oldImagePaths) {
        try {
            console.log(oldImagePaths.rows[0].images);
            await deleteFiles(oldImagePaths.rows[0].images);
        } catch (err) {
          console.error("Couln't delete files", err);
        }
      }

      // Replace db image paths
      console.log("replacing images");
      await client.query('UPDATE listings SET images = $1 WHERE id = $2', [imgPaths, req.params.id]);
    }
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