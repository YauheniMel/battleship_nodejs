import { helpers } from '../helpers/index';
import { IShip, IdentifiedWebSocket } from 'types';
import { Controller, wss } from '../websocket/index';

export const add_ships = (userShips: {
  gameId: number;
  ships: IShip[];
  indexPlayer: number;
}) => {
  Controller.setShips(userShips, userShips.indexPlayer);

  const roomReadyToPlay = Controller.getRoomReadyToPlay();

  if (roomReadyToPlay) {
    const [playerTable, enemyTable] = roomReadyToPlay.players.map((player) => ({
      currentPlayerIndex: player.userId,
      ships: player.ships,
    }));

    (wss.clients as Set<IdentifiedWebSocket>).forEach((socket) => {
      if (playerTable?.currentPlayerIndex === socket.clientId) {
        socket.send(helpers.start_game(playerTable));
        socket.send(helpers.turn(roomReadyToPlay.turn));
      } else if (enemyTable?.currentPlayerIndex === socket.clientId) {
        socket.send(helpers.start_game(enemyTable));
        socket.send(helpers.turn(roomReadyToPlay.turn));
      }
    });
  }
};
