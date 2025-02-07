// db.js
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const dbName = 'db.db';
require('dotenv').config();

// This creates/opens the SQLite DB in the file system. 
// If the file does not exist, it will be created automatically.
const db = new sqlite3.Database(dbName, (err) => {
  if (err) {
    return console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the realestate.db database.');
  }
});

// Create the soldHomes table if it doesn't exist.
const createTableQuery = `
  CREATE TABLE IF NOT EXISTS soldHomes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip INTEGER NOT NULL,
    price INTEGER NOT NULL,
    beds INTERGER NOT NULL,
    baths INTEGER NOT NULL,
    sqft INTEGER NOT NULL,
    description TEXT NOT NULL,
    image TEXT
  )
`;

db.run(createTableQuery, (err) => {
  if (err) {
    return console.error('Error creating soldHomes table:', err.message);
  }
  console.log('soldHomes table initialized or already exists.');
});

/*
db.run(`CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL)`, (err) => {
  if (err) {
    return console.error('Error creating admin table:', err.message);
  }
  console.log('admin table initialized or already exists.');
});

db.run(`CREATE TABLE IF NOT EXISTS testimonials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rating INTEGER NOT NULL,
  reviewText TEXT NOT NULL,
  names TEXT NOT NULL)`, (err) => {
if (err) {
  return console.error('Error creating testimonials table:', err.message);
} else {
  console.log('admin table initialized or already exists.');
}
});

db.get(`SELECT COUNT(*) as count FROM testimonials`, (err, row) => {
  if (err) {
    return console.error(err.message);
  }

  if (row.count === 0) {
    db.run(`INSERT INTO testimonials (rating, reviewText, names) VALUES\
      (5, 'Bob Diersing is the best realtor I've ever met. Our past two deals are record-setting deals, worth over $5 million.\
            Bob consistently goes above and beyond to get the deal done. Thank you again, Bob, for helping me realize all of \
            my goals with real estate.', 'William & Marina Keck' )`, (err) => {
              if (err) {
                return console.error(err);
              }
            })
  }
});
*/

// Optional: Insert sample listings if the table is empty
const checkAndInsertSampleData = `
  SELECT COUNT(*) as count FROM soldHomes
`;

db.get(checkAndInsertSampleData, (err, row) => {
  if (err) {
    return console.error(err.message);
  }

  if (row.count === 0) {
    const insertSampleQuery = `
      INSERT INTO soldHomes (title, type, address, city, state, zip, price, beds, baths, sqft, description, image)
      VALUES
        ('I sold $451,500 over asking, still the highest sale in highland light village', 'Single Family Residence', '2119 Via Aguila', 'San Clemente', 'CA', 92673, 2451500, 5, 3, 2625, 'discription', '/images/viaAguliaHouse.jpg'),
        ('Off Market Sale', 'Single Family Residence', '15 Via Timon', 'San Clemente', 'CA', 92673, 1645000, 4, 3, 2872, 'discription', '/images/viaTimonHouse.jpg'),
        ('I sold an out of area listing at a higher price that what local agents brought to seller', 'Single Family Residence', '1915 Via Coronel', 'Palos Verdes Estates', 'CA', 90274, 3950000, 5, 4, 3189, 'discription', '/images/viaCoronelHouse.jpg'),
        ('Record breaking price for tract', 'Single Family Residence', '28951 Calle Susanna', 'San Juan Capistrano', 'CA', 92675, 2100000, 5, 4, 3139, 'discription', '/images/calleSusannaHouse.jpg'),
        ('Record breaking price with no one coming close', 'Condominium', '405 Avenida Granada', 'San Clemente', 'CA', 92672, 2530000, 2, 2, 1282, 'discription', '/images/avenidaHouse.jpg'),
        ('I got my buyers in front of the other offers to win them their one of a kind forever home', 'Single Family Residence', '2001 Via Teca', 'San Clemente', 'CA', 92673, 3500000, 4, 5, 5456, 'discription', '/images/viaTecaHouse.jpg');
    `;
    db.run(insertSampleQuery, (err) => {
      if (err) {
        return console.error('Error inserting sample data:', err.message);
      }
      console.log('Sample listings inserted.');
    });
  }
});

/*
async function createAdmin() {
  const username = 'admin';
  const password = 'admin1';//process.env.ADMIN_PASS;
  const hashedPassword = await bcrypt.hash(password, 10);

  db.run(
    'INSERT INTO admins (username, password) VALUES (?, ?)',
    [username, hashedPassword],
    (err) => {
      if (err) {
        console.error('Error creating admin:', err.message);
      } else {
        console.log('Admin created successfully.');
      }
    }
  );

}

createAdmin();

// Function to retrieve admin by username
function getAdmin(username) {
  return new Promise((resolve, reject) => {
    
    db.get('SELECT * FROM admins WHERE username = ?', [username], (err, row) => {
      if (err) {
        console.error('Error fetching admin:', err);
        return reject(err);
      }
      resolve(row);
    });
  });
}
*/

// Function to add a listing
function addListing(listing) {
  return new Promise((resolve, reject) => {
    const { title, price, description } = listing;
    db.run(
      `INSERT INTO soldHomes (title, type, address, city, state, zip, price, beds, baths, sqft, description, image) VALUES 
        (?, 'type', 'address', 'city', 'state', '99999', ?, '0', '0', '0', ?,'/images/viaTimonHouse.jpg')`,
      [title, price, description],
      function (err) {
        if (err) {
          console.error('Error adding listing:', err);
          return reject(err);
        } else {
        resolve(this.lastID);
        }
      }
    );
  });
}

module.exports = {db, addListing};
