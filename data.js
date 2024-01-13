export const partsByType = {};
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

export default async function loadData() {
  const data = await fetch('starfield.json').then(response => response.json())
  Object.assign(partsByType, data);
  for (const partType in data) {
    Object.assign(allParts, data[partType]);
  }
}
