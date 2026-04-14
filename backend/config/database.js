require('dotenv').config();

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'brivska_akademija',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

const initDatabase = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  });

  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'brivska_akademija'}\``);
  await connection.query(`USE \`${process.env.DB_NAME || 'brivska_akademija'}\``);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      first_name VARCHAR(50) NOT NULL,
      last_name VARCHAR(50) NOT NULL,
      email VARCHAR(100) NOT NULL UNIQUE,
      phone VARCHAR(20) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      has_access BOOLEAN DEFAULT FALSE,
      role ENUM('user', 'admin') DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      stripe_payment_id VARCHAR(255) NOT NULL,
      stripe_customer_id VARCHAR(255),
      amount DECIMAL(10, 2) NOT NULL,
      currency VARCHAR(10) DEFAULT 'eur',
      status VARCHAR(50) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS password_resets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      token VARCHAR(255) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      used BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS videos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      video_url VARCHAR(500) NOT NULL,
      thumbnail_url VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS appointments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      barber_id INT,
      appointment_date DATE NOT NULL,
      appointment_time TIME NOT NULL,
      status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  try {
    await connection.query('ALTER TABLE appointments ADD COLUMN barber_id INT AFTER user_id');
  } catch (e) {
    // Column already exists
  }

  await connection.query(`
    CREATE TABLE IF NOT EXISTS barbers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      image_url VARCHAR(500),
      age INT,
      active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  console.log('Database initialized successfully');

  const [adminExists] = await connection.query(
    'SELECT id FROM users WHERE email = ?',
    [process.env.ADMIN_EMAIL || 'admin@brivska-akademija.si']
  );

  if (adminExists.length === 0) {
    const adminPasswordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 12);
    await connection.query(
      'INSERT INTO users (first_name, last_name, email, phone, password_hash, has_access, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['Admin', 'Admin', process.env.ADMIN_EMAIL || 'admin@brivska-akademija.si', '0000000000', adminPasswordHash, true, 'admin']
    );
    console.log('Admin user created');
  } else {
    console.log('Admin user already exists');
  }

  const [videosExist] = await connection.query('SELECT COUNT(*) as count FROM videos');
  if (videosExist[0].count === 0) {
    await connection.query(`
      INSERT INTO videos (title, description, video_url, thumbnail_url) VALUES
      ('Osnove britja z britvico', 'Naučite se osnov britja z britvico', 'SLIKE/20241012_164035.mp4', 'SLIKE/brivci/luka.jpg'),
      ('Napredne tehnike britja', 'Napredne tehnike za profesionalce', 'media/video2.mp4', 'SLIKE/brivci/djole.jpg'),
      ('Nega brade in brkov', 'Kako negovati brado in brke', 'media/video3.mp4', 'SLIKE/brivci/zan.jpg'),
      ('Vzdrževanje orodij', 'Vzdrževanje britvic in orodij', 'media/video4.mp4', 'SLIKE/brivci/mladen.jpg')
    `);
    console.log('Sample videos created');
  } else {
    console.log('Videos already exist');
  }

  const [barbersExist] = await connection.query('SELECT COUNT(*) as count FROM barbers');
  if (barbersExist[0].count === 0) {
    await connection.query(`
      INSERT INTO barbers (name, description, image_url, age) VALUES
      ('Luka Oven', 'Mojster brivec z večletnimi izkušnjami', 'SLIKE/brivci/luka.jpg', 23),
      ('Đorđe Petrović', 'Strokovnjak za nego brade', 'SLIKE/brivci/djole.jpg', 34),
      ('Žan Novak', 'Britar tehnik britja in vzdrževanja orodij', 'SLIKE/brivci/zan.jpg', 27),
      ('Mladen Kovač', 'Brivec sodobnega časa', 'SLIKE/brivci/mladen.jpg', 31)
    `);
    console.log('Sample barbers created');
  } else {
    console.log('Barbers already exist');
  }

  await connection.end();
};

module.exports = { pool, initDatabase };
