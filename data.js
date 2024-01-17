import * as formulas from './formulas.js';

export const partsByType = {};
window.partsByType = partsByType;
export const allParts = {};
export const fixedParts = [
  'Reactor',
  'Shield Generator',
  'Grav Drive',
  'Cockpit',
  'Docker',
  'Landing Bay',
];
export const weaponTypes = [
  'Ballistic',
  'Electromagnetic',
  'Energy',
  'Missile',
  'Particle Beam',
];

export const topSpeeds = {
  'White Dwarf 3015': 180,
  A: 150,
  B: 140,
  C: 130,
};


export const details = {
  Engine: {
    fields: ['class', 'power', 'thrust', 'mthrust', 'health'],
    derived: {
      topSpeed: (part, name) => topSpeeds[part.name] || topSpeeds[part.class],
      mmRatio: (part) => part.mthrust / part.mass,
      mpRatio: (part) => part.mthrust / part.power,
    },
  },
  Reactor: {
    fields: ['class', 'power', 'regen', 'health'],
    derived: {
    },
  },
  'Grav Drive': {
    fields: ['class', 'power', 'jump', 'health'],
    derived: {
      jpRatio: (part) => part.jump / part.power,
      maxMass: (part) => formulas.maxMassForJump(part.jump, Number(ui.targetRange.value)) - part.mass,
    },
  },
};

export default async function loadData() {
  const data = await fetch('starfield.json').then(response => response.json())
  Object.assign(partsByType, data);
  for (const partType in data) {
    Object.assign(allParts, data[partType]);
  }
}
