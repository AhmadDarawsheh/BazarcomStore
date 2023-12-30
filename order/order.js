const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const axios = require("axios");
// const db = new sqlite3.Database("../msdb.db", sqlite3.OPEN_READWRITE, (err) => {
//   console.log("database connected");
//   if (err) return console.error(err.message);
// });

app.use(bodyParser.json());

app.get("/purchase/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id);

    const response = await axios.get(
      `http://localhost:3000/Bazarcom/purchase/${id}`
    );
    console.log(response.data);
    const message = response.data;
    res.json({ message });
  } catch (err) {
    return res.json({ message: "An error has occured", err });
  }
});

// app.get("/Bazarcom/purchase/:id", (req, res) => {
//   const { id } = req.params;
//   let sql1 = `SELECT stock FROM books where id = ?`;

//   db.get(sql1, [id], (err, row) => {
//     if (err) {
//       return console.log(err.message);
//     }

//     let v1;

//     if (row.stock) {
//       const sql = `UPDATE books SET stock = stock - 1 WHERE id = ? RETURNING stock`;
//       db.get(sql, [id], (err, result) => {
//         if (err) {
//           console.log(err);
//         }
//         v1 = result.stock;
//         console.log("books left in stock: ",result.stock);

//       });

//       return res.send("purchased successfuly");
//     }
//     res.send("stock is empty");
//   });
// });

app.listen(4001, () => {
  console.log("order server is running");
});
