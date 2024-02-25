import { IAttackFeedback } from 'types';

export const attack = (attackFeedback: IAttackFeedback) =>
  JSON.stringify({
    type: 'attack',
    data: JSON.stringify(attackFeedback),
    id: 0,
  });
