import { IError, IUser } from 'types';

export const reg = (user: IUser & IError) => {
  return JSON.stringify({
    type: 'reg',
    data: JSON.stringify(user),
    id: 0,
  });
};
