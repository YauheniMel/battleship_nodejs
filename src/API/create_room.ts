import { helpers } from '../helpers/index';
import { IdentifiedWebSocket } from 'types';
import { socketResponse } from '../utils/socketResponse';
import { DB } from '../websocket/index';

export const create_room = (ws: IdentifiedWebSocket) => {
  DB.createRoom(ws.clientId);

  const availableRooms = DB.getAvailableRooms();

  socketResponse(helpers.update_room, availableRooms);
};
