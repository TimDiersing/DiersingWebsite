// db.js
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const dbName = 'realestate.db';

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

db.run(`CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL)`, (err) => {
  if (err) {
    return console.error('Error creating admin table:', err.message);
  }
  console.log('admin table initialized or already exists.');
});

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
        ('Off Market Sale', 'Single Family Residence', '15 Via Timon', 'San Clemente', 'CA', 92673, 1645000, 4, 3, 2872, 'discription', '/images/viaTimonHouse.jpg'),
        ('title', 'Single Family Residence', '1915 Via Coronel', 'Palos Verdes Estates', 'CA', 90274, 3950000, 5, 4, 3189, 'discription', '/images/viaCoronelHouse.jpg'),
        ('Title', 'Single Family Residence', '28951 Calle Susanna', 'San Juan Capistrano', 'CA', 92675, 2100000, 5, 4, 3139, 'discription', '/images/calleSusannaHouse.jpg'),
        ('Title', 'Condominium', '405 Avenida Granada', 'San Clemente', 'CA', 92672, 2530000, 2, 2, 1282, 'discription', '/images/AvenidaHouse.jpg'),
        ('Title', 'Single Family Residence', '2001 Via Teca', 'San Clemente', 'CA', 92673, 3500000, 4, 5, 5456, 'discription', '/images/viaTecaHouse.jpg');
    `;
    db.run(insertSampleQuery, (err) => {
      if (err) {
        return console.error('Error inserting sample data:', err.message);
      }
      console.log('Sample listings inserted.');
    });
  }
});

async function createAdmin() {
  const username = 'admin';
  const password = 'admin1';
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

module.exports = {db, getAdmin, addListing };
