const express = require("express");
const app = express();
const bodyParser = require("body-parser");

const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("../msdb.db", sqlite3.OPEN_READWRITE, (err) => {
  if (err) return console.error(err.message);
});

app.use(bodyParser.json());

const sql = `CREATE TABLE IF NOT EXISTS books(id INTEGER PRIMARY KEY,title,stock,cost,topic)`;
db.run(sql);

app.post("/Bazarcom/addBook", (req, res) => {
  const { title, stock, cost, topic } = req.body;

  res.json({ message: "success", title, stock, cost, topic });

  const insert = `INSERT INTO books(title,stock,cost,topic) VALUES (?,?,?,?)`;
  db.run(insert, [title, stock, cost, topic], (err) => {
    if (err) return console.error(err.message);
  });

  res.json({ message: "sucess" });
});

app.get("/Bazarcom/search/all", (req, res) => {
  const sql = `SELECT * FROM books`;
  db.all(sql, [], (err, rows) => {
    if (err) return console.error(err.message);
    rows.forEach((row) => {
      console.log(row);
    });

    return res.json(rows);
  });

  //return res.send("Welcome to Bazarcom");
});

app.get("/Bazarcom/search/:topic", (req, res) => {
  const { topic } = req.params;

  const sql = `SELECT id,title FROM books WHERE topic = '${topic}'`;
  db.all(sql, [], (err, rows) => {
    if (err) return console.error(err.message);
    rows.forEach((row) => {
      res.json(row);
    });
  });
});

app.get("/Bazarcom/searchim/:itemNubmer", (req, res) => {
  const { itemNubmer } = req.params;

  const sql = `SELECT id,title FROM books WHERE id = ${itemNubmer}`;
  db.all(sql, [], (err, rows) => {
    if (err) return console.error(err.message);
    rows.forEach((row) => {
      res.json(row);
    });
  });
});

app.get("/Bazarcom/purchase/:id", (req, res) => {
  const { id } = req.params;
  let sql1 = `SELECT stock FROM books where id = ?`;

  db.get(sql1, [id], (err, row) => {
    if (err) {
      return console.log(err.message);
    }

    let v1;

    if (row.stock) {
      const sql = `UPDATE books SET stock = stock - 1 WHERE id = ? RETURNING stock`;
      db.get(sql, [id], (err, result) => {
        if (err) {
          console.log(err);
        }
        v1 = result.stock;
        console.log("books left in stock: ",result.stock);
      

      });

      return res.send("purchased successfuly");
    }
    res.send("stock is empty");
  });
});



app.listen(3002, () => {
  console.log("server is running 3002");
});
