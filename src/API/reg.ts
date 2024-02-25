import { helpers } from '../helpers/index';
import { IUserCredentials, IdentifiedWebSocket } from 'types';
import { socketResponse } from '../utils/socketResponse';
import { DB } from '../websocket/index';
import { userValidation } from '../utils/userValidation';

export const reg = (
  userCredentials: IUserCredentials,
  ws: IdentifiedWebSocket,
) => {
  try {
    userValidation(userCredentials);

    const createdUser = DB.createUser(userCredentials);

    if (createdUser.index) ws.clientId = createdUser.index;

    ws.send(helpers.reg({ ...createdUser, error: false, errorText: '' }));

    const availableRooms = DB.getAvailableRooms();

    socketResponse(helpers.update_room, availableRooms);
  } catch (err: any) {
    ws.send(
      helpers.reg({
        error: true,
        errorText: err.message,
        name: '',
        index: 111111111111,
      }),
    );
  }
};
