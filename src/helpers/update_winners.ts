import { IUserRating } from 'types';

export const update_winners = (userRatings: IUserRating[]) =>
  JSON.stringify({
    type: 'update_winners',
    data: JSON.stringify(userRatings),
    id: 0,
  });
