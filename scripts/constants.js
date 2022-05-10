const gameCards = [
  {
    id: 1,
    name: 'Mayer Leonard',
    type: 'monster',
    image: './images/field-cards/mayer.jpg',
    imageName: 'mayer',
    value: 12,
    health: 12,
    tempHealth: 12,
  },
  {
    id: 2,
    name: 'Kirkland Merrill',
    type: 'monster',
    image: './images/field-cards/kirkland.jpg',
    imageName: 'kirkland',
    value: 10,
    health: 10,
    tempHealth: 10,
  },
  {
    id: 3,
    name: 'Mullins Barnett',
    type: 'monster',
    image: './images/field-cards/mullins.jpg',
    imageName: 'mullins',
    value: 8,
    health: 8,
    tempHealth: 8,
  },
  {
    id: 4,
    name: 'Mullineaux Mccall',
    type: 'monster',
    image: './images/field-cards/mccall.jpg',
    imageName: 'mccall',
    value: 6,
    health: 6,
    tempHealth: 6,
  },
  {
    id: 5,
    name: 'Beard Mckenzie',
    type: 'monster',
    image: './images/field-cards/beard.jpg',
    imageName: 'beard',
    value: 4,
    health: 4,
    tempHealth: 4,
  },
  {
    id: 6,
    name: 'Thunder',
    type: 'spell',
    image: './images/field-cards/thunder.jpg',
    imageName: 'thunder',
    value: 10,
  },
  {
    id: 7,
    name: 'Fireball',
    type: 'spell',
    image: './images/field-cards/fireball.jpg',
    imageName: 'fireball',
    value: 8,
  },
  {
    id: 8,
    name: 'Wind Bolt',
    type: 'spell',
    image: './images/field-cards/windbolt.jpg',
    imageName: 'windbolt',
    value: 6,
  },
  {
    id: 9,
    name: 'Healing Hand',
    type: 'heal',
    image: './images/field-cards/healinghand.jpg',
    imageName: 'healinghand',
    value: 6,
  },
  {
    id: 10,
    name: 'Healing Touch',
    type: 'heal',
    image: './images/field-cards/healingtouch.jpg',
    imageName: 'healingtouch',
    value: 4,
  },
];

const gameValues = {
  player: 'player',
  ai: 'ai',
  monster: 'monster',
  spell: 'spell',
  heal: 'heal',
};

const gamePhaseState = {
  draw: 'draw',
  attack: 'attack',
  end: 'end',
};

const buttonValues = {
  attack: 'Attack',
  heal: 'Heal',
  startRound: 'Play Card',
  opponentRound: "Opponent's Turn",
  endRound: 'End Round',
};

const cardTypeValues = {
  monster: 1,
  spell: 0.8,
  heal: 0.4,
};
