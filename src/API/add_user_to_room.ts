import { helpers } from '../helpers/index';
import { IdentifiedWebSocket } from 'types';
import { socketResponse } from '../utils/socketResponse';
import { Controller, DB, wss } from '../websocket/index';

export const add_user_to_room = (
  indexRoom: number,
  ws: IdentifiedWebSocket,
) => {
  const userIds = DB.addUserToRoom(indexRoom, ws.clientId);

  const availableRooms = DB.getAvailableRooms();
  socketResponse(helpers.update_room, availableRooms);

  if (userIds.length) {
    const idGame = Controller.createGame(userIds);

    (wss.clients as Set<IdentifiedWebSocket>).forEach((socket) => {
      if (userIds.includes(socket.clientId)) {
        socket.send(helpers.create_game({ idGame, idPlayer: socket.clientId }));
      }
    });
  }
};
