const { Command } = require("commander");
const program = new Command();
const axios = require("axios");
const readline = require("readline");
const redis = require("redis");
const express = require("express");
const { resolve } = require("path");

const app = express();
app.use(express.json());

const client = redis.createClient({
  host: "localhost",
  port: 6379,
});
client.on("error", (err) => {
  console.error("An Redis error has occured: ", error);
});

const r1 = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// const cache = new Map();

let catalogServer = 1;
let orderServer = 1;
// Load Balancing;
const toggleCatalogServer = () => {
  const server = `http://localhost:300${catalogServer}`;
  catalogServer = (catalogServer % 2) + 1;
  console.log(catalogServer);
  return server;
};

const toggleOrderServer = () => {
  const server = `http://localhost:400${orderServer}`;
  orderServer = (orderServer % 2) + 1;
  return server;
};

const invalidateCache = (key) => {
  client.del(key);
  console.log("deleted")
};
const mainmenu = () => {
  r1.question('Enter a comamand (Type "exit" to quit."):', (input) => {
    const [command, bookId] = input.split(" ");
    if (command == "exit") {
      console.log("Exiting CLI ...");
      r1.close();
      process.exit(0);
    } else {
      program.parse([command, bookId], { from: "user" });
      mainmenu();
    }
  });
};

app.post("/invalidateCache", async (req, res) => {
  try {
    const { key } = req.body;
    const invalid = `catalog_${key}`
    await invalidateCache(invalid);
    console.log("Cache Invalidated");
  } catch (err) {
    console.error("Error invalidating cache", err);
    res.json({ message: "Error invalidating cache" });
  }
});

program
  .name("DOSMicroservices")
  .description("CLI to performe as a frontend server")
  .version("1.0.0");

program
  .command("get <bookId>")
  .alias("g")
  .description("Get the details of a book from database.")
  .action((bookId) => {
    const cacheKey = `catalog_${bookId}`;
    client.get(cacheKey, (err, cachedData) => {
      if (err) {
        console.log("Redis error ", err);
        return;
      }
      if (cachedData) {
        console.log("\nCache Hit: ", JSON.parse(cachedData));
        return;
      }

      console.log(catalogServer);
      const serverUrl = toggleCatalogServer();

      console.log("Fetching data from the server: ", serverUrl);
      axios
        .get(`${serverUrl}/Bazarcom/searchim/${bookId}`)
        .then((response) => {
          console.log(
            "\nCache miss. Retrived data from server ",
            response.data
          );
          client.setex(cacheKey, 3600, JSON.stringify(response.data));
          return;
        })
        .catch((err) => {
          console.error("Error retrieving data", err.message);
        });
    });
  });

program
  .command("purchase <bookId>")
  .alias("p")
  .description("List all the books.")
  .action((bookId) => {
    const serverUrl = toggleOrderServer();
    console.log("Fetching data from the server: ", serverUrl);

    axios
      .get(`${serverUrl}/purchase/${bookId}`)
      .then((response) => {
        console.log("\nBook purchased successfully!");
      })
      .catch((err) => {
        console.error("Error purchasing the book", err.message);
      });
  });

app.listen(5000, () => {
  console.log("\n");
  console.log("Frontend server is running...");
});
mainmenu();
