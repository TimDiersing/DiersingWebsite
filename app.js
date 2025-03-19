// app.js
const express = require('express');
const path = require('path');
const { engine } = require('express-handlebars');
const pool = require('./db');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const nodemailer = require('nodemailer');
const fs = require('fs');
const axios = require('axios');
require('dotenv').config();
 
const app = express();
const PORT = process.env.PORT || 5500;

// Set up Handlebars
app.engine('handlebars', engine({
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'views', 'layouts'),
}));

app.set('view engine', 'handlebars');


// MIDDLEWEAR 
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use((req, res, next) => {
  res.locals.fullName = "Bob Diersing";
  res.locals.phone = "949.683.1958";
  res.locals.email = "bobdiersing@firstteam.com";
  res.locals.office = "32451 Golden Lantern #210, Laguna Niguel, CA 92677";
  res.locals.officeShort = "32451 Golden Lantern, Laguna Niguel";
  res.locals.currentYear = new Date().getFullYear();
  next();
});

app.use(session({
  secret: process.env.SESSION_SECRET,
  cookie: { maxAge: 1000 * 60 * 60 },
  saveUninitialized: false,
  resave: false,
  store: new pgSession({
    pool: pool,
    tableName: 'session'
  })
}));

// ROUTES
// Home route
app.get('/', async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const soldHomes = await client.query('SELECT * FROM listings WHERE type = $1 ORDER BY id DESC', ['sold']);
    const listings = await client.query('SELECT * FROM listings WHERE type = $1 ORDER BY id DESC', ['listed']);
    const testimonials = await client.query('SELECT * FROM testimonials ORDER BY id DESC');

    res.render('home', {
      pageTitle: 'Bob Diesing',
      heroText: 'Find Your Perfect Home',
      listings: listings.rows,
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
    const soldHomes = await client.query('SELECT * FROM listings WHERE type = $1', ['sold']);
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

function getListingImages(req, res, next) {
  fs.readdir(path.join(__dirname, 'public/images/house' + req.params.id), (err, images) => {
    if (err) {
      return next(err);
    }
    res.locals.imageFiles = images;
    next();
  });
}

// Single listing route
app.get('/listing/:id', getListingImages, async (req, res) => {
  const listingId = parseInt(req.params.id, 10);

  let client;
  try {
    client = await pool.connect();
    const listing = await client.query('SELECT * FROM listings WHERE id = $1', [listingId]);
    res.render('listing', {
      pageTitle: listing.rows[0].title,
      listing: listing.rows[0],
      listingImages: res.locals.imageFiles,
      imageFolder: '/images/house' + req.params.id,
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

// Testimonials route
app.get('/testimonials', async (req, res) => {
  let client;

  try {
    client = await pool.connect();
    const dbData = await client.query('SELECT * FROM testimonials');
    res.render('testimonials', {
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
  const errorMessages = {
    captcha_failed: 'CAPTCHA verification failed. Please try again.',
    missing_token: 'Please complete the CAPTCHA.',
    server_error: 'Server error. Please try again later.',
  };
  
  const errorKey = req.query.error;
  const error = errorMessages[errorKey];
  res.render('contact', {
    pageTitle: 'Contact - Bob Diersing',
    error: error,
    userFName: req.query.user_fname,
    userLName: req.query.user_lname,
    userEmail: req.query.user_email,
    userPhone: req.query.user_phone,
    userMessage: req.query.user_message
  });
}); 

app.post('/contact', async (req, res) => {
  const { fname, lname, email, phone, message, 'g-recaptcha-response': token} = req.body;
  if (!token) {
    return res.redirect(`/contact?error=missing_token&user_fname=${encodeURIComponent(fname)}&user_lname=${encodeURIComponent(lname)}&user_email=${encodeURIComponent(email)}&user_phone=${encodeURIComponent(phone)}&user_message=${encodeURIComponent(message)}`);
  }

  const response = await axios.post(`https://www.google.com/recaptcha/api/siteverify`,
    new URLSearchParams({
      secret: process.env.CAP_SECRET,
      response: token,
    })
  );
  
  const {success, 'error-codes': capErrors } = response.data;
  if (success == true) {
      try {
        const transport = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          }
        });
    
        const info = await transport.sendMail({
          from: process.env.EMAIL_USER,
          to: process.env.EMAIL_SEND,
          subject: "Message from website",
          html: "<br>First Name: " + fname + "<br>Last Name: " + lname +
                "<br>Email: " + email +
                "<br>Phone: " + phone +
                "<br>Message: " + message,
        })
        console.log('Email sent');
        res.redirect('/thank-you');
      } catch (err) {
        console.log('Email failed to send');
        res.status(500).send(err);
      }
  } else {
    console.error('reCatcha error', capErrors);
    res.redirect(`/contact?error=captcha_failed&user_fname=${encodeURIComponent(fname)}&user_lname=${encodeURIComponent(lname)}&user_email=${encodeURIComponent(email)}&user_phone=${encodeURIComponent(phone)}&user_message=${encodeURIComponent(message)}`);
  }
});

// Thank you route
app.get('/thank-you', (req, res) => {
  res.render('thankYou', {
    pageTitle: 'Thank You - Bob Diersing'
  });
});

// Privacy Policy route
app.get('/privacy-policy', (req, res) => {
  res.render('privacyPolicy', {
    pageTitle: 'Privacy Policy - Bob Diersing'
  });
});

const adminRouter = require('./routes/adminRouter');
app.use('/admin', adminRouter);

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
