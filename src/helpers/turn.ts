export const turn = (currentPlayer: number) =>
  JSON.stringify({
    type: 'turn',
    data: JSON.stringify({
      currentPlayer,
    }),
    id: 0,
  });
