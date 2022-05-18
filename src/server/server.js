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
var rooms = [];

// IO
io.on("connection", (socket) => {
  socket.on("AddPlayerToLobby", (playerToServer) => {
    if (!rooms.length) {
      rooms.push([]);
    }
    rooms.forEach((room, i) => {
      if (room.length < 4) {
        rooms[i].push(
          addNewPlayerToLobby(
            playerToServer,
            socket.id,
            i + 1,
            getStartingPosition(room.length)
          )
        );
        io.emit("lobbyPlayers", rooms[i]);
      } else {
        room = [
          addNewPlayerToLobby(playerToServer, getStartingPosition(room.length)),
        ];
      }
    });
  });
  socket.on("disconnect", () => {
    rooms.forEach((room, i) => {
      room.forEach((player) => {
        if (player.id === socket.id) {
          rooms[i] = room.filter((play) => play !== player);
          io.emit("lobbyPlayers", rooms[i]);
        }
      });
    });
  });
});

// SERVER
httpServer.listen(3000, () => {
  console.log("listening on *:3000");
});

// FUNCTIONS
function addNewPlayerToLobby(playerToServer, id, roomId, position) {
  const name = playerToServer;
  return { name, id, roomId, position };
}

function getStartingPosition(roomcount) {
  switch (roomcount) {
    case 0:
      return { x: 756, y: 565 };
    case 1:
      return { x: 1970, y: 565 };
    case 2:
      return { x: 1970, y: 1402 };
    case 3:
      return { x: 756, y: 1402 };
    default:
      break;
  }
}
