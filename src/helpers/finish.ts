export const finish = (winPlayer: number) =>
  JSON.stringify({
    type: 'finish',
    data: JSON.stringify({
      winPlayer,
    }),
    id: 0,
  });
