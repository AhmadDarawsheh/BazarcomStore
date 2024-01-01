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
  // console.log(catalogServer);
  return server;
};

const toggleOrderServer = () => {
  const server = `http://localhost:400${orderServer}`;
  orderServer = (orderServer % 2) + 1;
  return server;
};

const invalidateCache = (key) => {
  client.del(key);
};
const mainmenu = () => {
  console.log("\n");
  console.log('Type "add [title,stock,cost,topic]" to add a new book!');
  console.log('Type "purchase [bookID]" to buy a book!');
  console.log('Type "get [bookID]" to get a book!');
  console.log('Type "list" to list all books!');
  console.log('Type "search [topic]" to find books by topic');
  // r1.question('Enter a comamand (Type "exit" to quit."):', (input) => {
  //   const [command, bookId] = input.split(" ");
  //   if (command == "exit") {
  //     console.log("Exiting CLI ...");
  //     r1.close();
  //     process.exit(0);
  //   } else {
  //     program.parse([command,bookId], { from: "user" });
  //     mainmenu();
  //   }
  // });

  r1.question('Enter a comamand (Type "exit" to quit."):', (input) => {
    const args = input.split(" ").filter((arg) => arg.length > 0);
    if (args[0] === "exit") {
      console.log("Exiting CLI...");
      rl.close();
    } else {
      program.parseAsync([...args], { from: "user" }).catch((err) => {
        console.error(err);
        mainmenu(); // Re-prompt the main menu if there's an error
      });
    }
  });
};

app.post("/invalidateCache", async (req, res) => {
  try {
    const { key } = req.body;
    const invalid = `catalog_${key}`;
    await invalidateCache(invalid);
    console.log("Cache Invalidated");
    mainmenu();
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
  .command("add <title> <stock> <cost> <topic>")
  .alias("l")
  .description("List all the books.")
  .action((title, stock, cost, topic) => {
    const serverUrl = toggleCatalogServer();
    console.log("Adding data to the server: ", serverUrl);

    const data = {
      title,
      stock,
      cost,
      topic,
    };

    axios
      .post(`${serverUrl}/Bazarcom/addBook`, data)
      .then((response) => {
        console.log("\nAdding book to store ", response.data);
        mainmenu();
      })
      .catch((err) => {
        console.error("Error purchasing the book", err.message);
      });
  });

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
        mainmenu();
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
          console.log("\n");
          client.setex(cacheKey, 3600, JSON.stringify(response.data));
          mainmenu();
        })
        .catch((err) => {
          console.error("Error retrieving data", err.message);
        });
    });
  });

program
  .command("purchase <bookId>")
  .alias("p")
  .description("Buy a book!")
  .action((bookId) => {
    const serverUrl = toggleOrderServer();
    console.log("Fetching data from the server: ", serverUrl);

    axios
      .get(`${serverUrl}/purchase/${bookId}`)
      .then((response) => {
        console.log("\nBook purchased successfully!");
        mainmenu();
      })
      .catch((err) => {
        console.error("Error purchasing the book", err.message);
      });
  });

program
  .command("list")
  .alias("l")
  .description("List all the books.")
  .action(() => {
    const serverUrl = toggleCatalogServer();
    console.log("Fetching data from the server: ", serverUrl);

    axios
      .get(`${serverUrl}/Bazarcom/search/all`)
      .then((response) => {
        console.log("\nListing the books: ", response.data);
        mainmenu();
      })
      .catch((err) => {
        console.error("Error purchasing the book", err.message);
      });
  });

program
  .command("search <topic> <topic2>")
  .alias("g")
  .description("List all the books.")
  .action((topic, topic2) => {
    const both = `${topic} ${topic2}`;
    console.log(both);
    const cacheKey = `catalog_${both}`;
    client.get(cacheKey, (err, cachedData) => {
      if (err) {
        console.log("Redis error ", err);
        return;
      }
      if (cachedData) {
        console.log("\nCache Hit: ", JSON.parse(cachedData));
        mainmenu();
        return;
      }

      console.log(catalogServer);
      const serverUrl = toggleCatalogServer();

      console.log("Fetching data from the server: ", serverUrl);
      console.log(both);
      axios
        .get(`${serverUrl}/Bazarcom/search/${both}`)
        .then((response) => {
          console.log(
            "\nCache miss. Retrived data from server ",
            response.data
          );
          console.log("\n");
          client.setex(cacheKey, 3600, JSON.stringify(response.data));
          mainmenu();
        })
        .catch((err) => {
          console.error("Error retrieving data", err.message);
        });
    });
  });

app.listen(5000, () => {
  // console.log("\n");
  // console.log("Frontend server is running...");
});
mainmenu();
