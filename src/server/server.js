/**
 * Minimal local multiplayer relay for Farm For Your Life.
 *
 * Designed for solo local development:
 *   - Auto-adds a passive "Sprout (bot)" lobby slot so the client's
 *     2-loaded-players gate can clear and the map can render.
 *   - On StartGame, echoes `updatePlayer` for every lobby member so each
 *     client's `loadedPlayers` array fills up (which marks `loadedIn: true`).
 *   - Forwards every PascalCase emit to its camelCase listener counterpart.
 *
 * Run with: npm run server
 */

const http = require("http");
const { Server } = require("socket.io");

const PORT = process.env.PORT || 3000;
const ORIGINS = ["http://localhost:4200", "http://127.0.0.1:4200"];

// Events the client emits → events the client listens for.
const EVENT_MAP = {
  keychange: "move",
  ChangePlayerTool: "changePlayerTool",
  ChangeBadgeCount: "changeBadgeCount",
  ChangePlayerState: "changePlayerState",
  ChangeHoveredFarm: "changeHoveredFarm",
  CultivateOthers: "cultivateOther",
  PlayerFromMiddle: "playerFromMiddle",
  DropPickupable: "dropPickupable",
  RemovePickupable: "removePickupable",
  PlayerCultivate: "playerCultivate",
  PlayerIsWatering: "playerIsWatering",
  GoInHouse: "goInHouse",
};

const httpServer = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Farm For Your Life relay server is running.\n");
});

const io = new Server(httpServer, {
  cors: { origin: ORIGINS, methods: ["GET", "POST"] },
});

/** In-memory lobby state. Maps socket id (or "bot-N") -> player payload. */
const lobby = new Map();

function makeBot(index) {
  return {
    name: `Sprout-${index}`,
    id: `bot-${index}`,
    state: "idle",
    loadedIn: false,
    moveup: false,
    movedown: false,
    moveleft: false,
    moveright: false,
    useRightAnims: true,
    canMoveHorizontal: true,
    canMoveVertical: true,
    moving: false,
    equippedTool: "shovel",
    isCarrying: false,
    isCultivating: false,
    isWatering: false,
    isBeingHit: false,
    canCarry: true,
    badgeCount: 0,
    width: 0,
    height: 0,
    roomId: index,
    hitdirection: { x: 0, y: 0 },
    position: { x: 200 + 80 * index, y: 200 },
    isBot: true,
  };
}

// Pre-seed a bot so single-client local dev clears the 2-player gate.
lobby.set("bot-1", makeBot(1));

const lobbyArray = () => Array.from(lobby.values());
const broadcastLobby = () => io.emit("lobbyPlayers", lobbyArray());

io.on("connection", (socket) => {
  console.log(`[connect] ${socket.id} (${io.engine.clientsCount} live)`);

  // Snapshot current lobby (real players + bot) to the new client.
  socket.emit("lobbyPlayers", lobbyArray());

  socket.on("AddPlayerToLobby", (payload) => {
    lobby.set(socket.id, { ...payload, id: socket.id, loadedIn: false });
    broadcastLobby();
  });

  socket.on("StartGame", () => {
    // Mark every lobby member loaded. The client's reducer concats each
    // payload into `loadedPlayers`, and the UpdateLobbyPlayers effect then
    // flips matching lobby players to `loadedIn: true`.
    for (const member of lobbyArray()) {
      const loaded = { ...member, loadedIn: true };
      io.emit("updatePlayer", loaded);
    }
  });

  socket.on("UpdatePlayer", (payload) => {
    if (payload && payload.name) {
      const existing = lobby.get(socket.id) || {};
      lobby.set(socket.id, { ...existing, ...payload });
    }
    socket.broadcast.emit("updatePlayer", payload);
  });

  for (const [incoming, outgoing] of Object.entries(EVENT_MAP)) {
    socket.on(incoming, (payload) => {
      if (incoming === "ChangePlayerState") {
        const existing = lobby.get(socket.id) || {};
        lobby.set(socket.id, { ...existing, ...payload });
      }
      socket.broadcast.emit(outgoing, payload);
    });
  }

  socket.on("disconnect", (reason) => {
    lobby.delete(socket.id);
    broadcastLobby();
    console.log(`[disconnect] ${socket.id} (${reason})`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Farm For Your Life relay listening on http://localhost:${PORT}`);
});
