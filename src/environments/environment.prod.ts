export const environment = {
  production: true,
  /**
   * When false, the app runs solo and never opens a Socket.IO connection.
   * Set to true to relay state through the server in `src/server/server.js`.
   */
  enableMultiplayer: false,
  socketUrl: 'http://localhost:3000',
};
