import ui from './ui.js';

const CUBE_ROOT = 1/3;

function jumpBonus() {
  return 1 + (Number(ui.jumpBonus.value) || 0) * .01;
}

export function jumpRange(mass, jump) {
  return (((682.911 * jump**3) / mass) ** CUBE_ROOT) * jumpBonus();
}

export function maxMassForJump(jump, range) {
  range = range / jumpBonus();
  return Math.floor(682.911 * ((jump / range) ** 3));
}

export function minJumpForRange(mass, range) {
  range = range / jumpBonus();
  return Math.ceil(((range**3 * mass) / 682.911) ** CUBE_ROOT);
}

export function mobility(mass, mthrust) {
  return (11.9 * mthrust / mass) - 47.6;
}

export function maxMassForMobility(mthrust, mobility) {
  return Math.floor(11.9 * mthrust / (mobility + 47.6));
}

export function minMThrustForMobility(mass, mobility) {
  return Math.ceil(mass * (mobility + 47.6) / 11.9);
}

export function minLandingForMass(mass) {
  return Math.ceil(mass / 200);
}

export function roundTo(val, scale) {
  return Math.floor(val * scale) / scale;
}
