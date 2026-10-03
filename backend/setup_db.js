const mysql = require('mysql2/promise');

async function setupDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'digi_law_reporter'
    });

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS judgments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        court_name VARCHAR(150) NOT NULL,
        judgment_date DATE NOT NULL,
        citation VARCHAR(100),
        petitioner_name VARCHAR(255),
        respondent_name VARCHAR(255),
        act_name VARCHAR(255),
        section_number VARCHAR(100),
        topics VARCHAR(255),
        head_note TEXT,
        content LONGTEXT,
        pdf_file_path VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await connection.execute(createTableQuery);
    console.log("Table 'judgments' created successfully or already exists.");
    await connection.end();
  } catch (error) {
    console.error("Error setting up database:", error);
  }
}

setupDatabase();
