import { IRoom } from 'types';

export const update_room = (rooms: IRoom[]) =>
  JSON.stringify({
    type: 'update_room',
    data: JSON.stringify(rooms),
    id: 0,
  });
