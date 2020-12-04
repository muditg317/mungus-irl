const repl = require('repl');
const socketIOClient = require('./frontend/node_modules/socket.io-client');

const server = process.argv.length === 3 ? `http://localhost:8080/debug` : `http://mungus.mudit.tech/debug`;
const SECRET = process.argv[process.argv.length - 1];

const replServer = repl.start({ prompt: '> ', preview:false });
const socket = socketIOClient(server, { forceNew: true, query: { SECRET } });

console.log(server, SECRET);

socket.on("connect", data => {
    replServer.clearBufferedCommand();
    console.log("debugger connected", data||'no data');
    replServer.displayPrompt();
});

socket.onAny((event, ...args) => {
  replServer.clearBufferedCommand();
  console.log(`got ${event}`);
  console.log(args);
  replServer.displayPrompt();
});


replServer.defineCommand('debug', (command) => {
  console.log("Retrieving debug info");
  socket.emit("debug_request", command || "", data => {
    // replServer.clearBufferedCommand();
    replServer.clearBufferedCommand();
    data.forEach(dat => console.log(dat));
    replServer.displayPrompt();
  });
});
