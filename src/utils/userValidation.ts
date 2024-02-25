import { IUserCredentials } from 'types';

export const userValidation = ({ name }: IUserCredentials) => {
  if (!Number.isNaN(+name)) {
    throw new Error('Invalid name');
  }
};
