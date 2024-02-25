export const create_game = (game: { idGame: number; idPlayer: number }) =>
  JSON.stringify({
    type: 'create_game',
    data: JSON.stringify(game),
    id: 0,
  });
