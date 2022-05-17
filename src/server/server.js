const express = require("express");
const app = express();
const http = require("http");
const httpServer = http.createServer(app);
const io = require("socket.io")(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.get("/", (req, res) => {
  res.send("<h1>Hello world</h1>");
});

// GLOBALS
var lobbyCount = 0;

// IO
io.on("connection", (socket) => {
  socket.on("AddPlayerToLobby", (playerToServer) => {
    addNewPlayerToLobby(playerToServer);
  });
});

// SERVER
httpServer.listen(3000, () => {
  console.log("listening on *:3000");
});

// FUNCTIONS
function addNewPlayerToLobby(playerToServer) {
  const newLobby = playerToServer.currentLobby.length
    ? playerToServer.currentLobby
    : [];
  const name = playerToServer.name;
  lobbyCount++;
  newLobby.push({ name, id: lobbyCount });
  io.emit("lobbyPlayers", newLobby);
}
