const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = 3000;

const db = new sqlite3.Database('bank.db');

db.serialize(() => {
  db.run('CREATE TABLE IF NOT EXISTS accounts (account_number TEXT PRIMARY KEY, balance INTEGER)');
  
  const insert = db.prepare('INSERT OR IGNORE INTO accounts (account_number, balance) VALUES (?, ?)');
  insert.run('1234567890', 1000);
  insert.run('9876543210', 500);
  insert.finalize();
});

app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.post('/debit', (req, res) => {
  const accountNumber = req.body.accountNumber;
  const debitAmount = parseInt(req.body.debitAmount);

  db.get('SELECT * FROM accounts WHERE account_number = ?', [accountNumber], (err, row) => {
    if (err) {
      res.status(500).send('Internal Server Error');
    } else if (!row) {
      res.status(404).send('Account not found');
    } else {
      const currentBalance = row.balance;

      if (currentBalance >= debitAmount) {
        const newBalance = currentBalance - debitAmount;

        db.run('UPDATE accounts SET balance = ? WHERE account_number = ?', [newBalance, accountNumber], (err) => {
          if (err) {
            res.status(500).send('Internal Server Error');
          } else {
            res.send(`Debit successful. New balance: ${newBalance}`);
          }
        });
      } else {
        res.status(400).send('Insufficient funds');
      }
    }
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
