const mysql = require('mysql2/promise');

async function inspectDb() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'rubinamirza',
    database: 'bad_teddy'
  });

  const [rows] = await connection.execute('SELECT id, name, category, image FROM products ORDER BY id ASC');
  console.log('--- PRODUCTS IN MYSQL ---');
  console.table(rows);
  await connection.end();
}

inspectDb().catch(console.error);
