const { Command } = require("commander");
const program = new Command();
const axios = require("axios");
const readline = require("readline");

const r1 = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const cache = new Map();

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
  const server = `http://localhost:400${catalogServer}`;
  orderServer = (orderServer % 2) + 1;
  return server;
};

const mainmenu = () => {
  r1.question('Enter a comamand (Type "exit" to quit."):', (input) => {
    const [command, bookId] = input.split(" ");
    if (command == "exit") {
      console.log("Exiting CLI ...");
      r1.close();
      process.exit(0);
    } else {
      program.parse([command, bookId],{from :'user'});
      mainmenu();
    }
  });
};

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
    if (cache.has(cacheKey)) {
      console.log("Cache hit", cache.get(cacheKey));
      return;
    }
    console.log(catalogServer);
    const serverUrl = toggleCatalogServer();

    console.log(serverUrl);
    axios
      .get(`${serverUrl}/Bazarcom/searchim/${bookId}`)
      .then((response) => {
        console.log("Cache miss. Retrived data from server", response.data);
        cache.set(cacheKey, response.data);
      })
      .catch((err) => {
        console.error("Error retrieving data", err.message);
      });
  });

program
  .command("list")
  .alias("l")
  .description("List all the books.")
  .action(() => {
    console.log("Listing the books");
  });

mainmenu();
