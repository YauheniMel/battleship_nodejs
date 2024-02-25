import { IRoom, IUser, IUserCredentials } from 'types';

export class DataBase {
  private _users: Array<IUser & { password: string; wins: number }> = [];
  private _rooms: IRoom[] = [];

  getUsers() {
    return this._users.map((user) => ({ index: user.index, name: user.name }));
  }

  getUsersRating() {
    return this._users.map((user) => ({ name: user.name, wins: user.wins }));
  }

  getUserById(userId: number): IUser {
    const user = this._users.find((user) => user.index === userId) as IUser & {
      password: string;
      wins: number;
    };

    return { name: user.name, index: user.index };
  }

  getRoomById(roomId: number): IRoom {
    return this._rooms.find((room) => room.roomId === roomId) as IRoom;
  }

  getAvailableRooms() {
    return this._rooms.filter((room) => room.roomUsers.length === 1);
  }

  createUser(userCredentials: IUserCredentials): IUser {
    const newUser = { ...userCredentials, index: this._users.length, wins: 0 };
    this._users.push(newUser);

    return { name: newUser.name, index: newUser.index };
  }

  createRoom(userId: number) {
    const user = this.getUserById(userId);

    const createdRoom = {
      roomId: this._rooms.length,
      roomUsers: [user],
    };

    this._rooms.push(createdRoom);
  }

  updateRoom(updatedRoom: IRoom) {
    this._rooms = this._rooms.map((room) =>
      room.roomId === updatedRoom.roomId ? updatedRoom : room,
    );
  }

  addUserToRoom(roomId: number, userId: number) {
    const targetRoom = this.getRoomById(roomId);

    const enemyId = (targetRoom.roomUsers[0] as IUser).index;

    if (enemyId === userId) return [];

    const user = this.getUserById(userId);

    targetRoom.roomUsers.push(user);

    this.updateRoom(targetRoom);

    return [userId, enemyId];
  }

  addUserWinPoint(winPlayer: number) {
    this._users = this._users.map((user) =>
      user.index === winPlayer ? { ...user, wins: user.wins + 1 } : user,
    );
  }
}
