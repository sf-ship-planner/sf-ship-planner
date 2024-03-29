import { allParts, fixedParts, weaponTypes } from './data.js';
import ui from './ui.js';
import PartRow from './partrow.js';
import * as formulas from './formulas.js';
window.formulas = formulas;

const baseSums = {
  value: 0,
  mass: 0,
  hull: 0,
  thrust: 0,
  mthrust: 0,
  jump: 0,
  landing: 0,
  fuel: 0,
  cargo: 0,
  shielded: 0,
  power: 0,
};

const totalFields = {
  totalValue: 'value',
  totalMass: 'mass',
  totalHull: 'hull',
  totalFuel: 'fuel',
  totalThrust: 'thrust',
  totalMThrust: 'mthrust',
  totalGrav: 'jump',
  totalLanding: 'landing',
};

class PartTable {
  constructor() {
    this.rows = [];
    this.fixedParts = {};
    this._init = false;

    this.update = this.update.bind(this);
    ui.targetGravRange.addEventListener('change', this.update);
    ui.targetSpeed.addEventListener('change', this.update);
    ui.targetMobility.addEventListener('change', this.update);
    ui.jumpBonus.addEventListener('change', this.update);

    this.updateFilters = this.updateFilters.bind(this, null);
    ui.filterA.addEventListener('click', this.updateFilters);
    ui.filterB.addEventListener('click', this.updateFilters);
    ui.filterC.addEventListener('click', this.updateFilters);
    ui.filterLevel.addEventListener('change', this.updateFilters);
    ui.filterDesign.addEventListener('change', this.updateFilters);
    ui.filterPiloting.addEventListener('change', this.updateFilters);

    this.updateValue = this.updateValue.bind(this, null);
    ui.discount.addEventListener('change', this.updateValue);
  }

  init() {
    for (const partType of fixedParts) {
      const row = this.addRow(partType);
      this.fixedParts[partType] = row;
    }
    this.addRow();
    this._init = true;
  }

  addRow(partType = null) {
    const row = new PartRow(partType);
    ui.mainTable.appendChild(row.row);
    this.rows.push(row);
    return row;
  }

  load() {
    let saved;
    try {
      saved = JSON.parse(localStorage.shipPlanner);
    } catch (err) {
      console.error(err);
      return;
    }

    this._init = false;
    for (let i = 0; i < saved.length; i++) {
      let row = this.rows[i];
      if (!row) {
        row = this.addRow();
      }
      const data = saved[i];
      const [partType, name, qty] = Array.isArray(data) ? data : [row.partType, data, 1];
      row.partType = partType;
      row.partName = name;
      row.quantity = qty;
      row.update();
    }
    this._init = true;
    this.update();
  }

  save() {
    try {
      const saved = [];
      for (const row of this.rows) {
        if (row.isFixedType) {
          saved.push(row.partName);
        } else if (row.partName) {
          saved.push([row.partType, row.partName, row.quantity]);
        }
      }
      localStorage.shipPlanner = JSON.stringify(saved);
    } catch (err) {
      console.error(err)
    }
  }

  _showTarget(field, condition, error) {
    const row = ui[`${field}Row`];
    row.classList.toggle('good', condition);
    row.classList.toggle('warn', !condition);
    if (!condition && error) {
      this._errors.push(`${error}`);
    }
  }

  _showTargetAbove(field, value, target, error) {
    ui[field].innerText = target;
    this._showTarget(field, target <= value, error);
  }

  _showTargetBelow(field, value, target, error) {
    ui[field].innerText = target;
    this._showTarget(field, target >= value, error);
  }

  _cautionIf(field, condition, className = 'caution') {
    ui[field].classList.toggle(className, condition);
  }

  _warnIf(field, condition, error) {
    this._cautionIf(field, condition, 'warn');
    if (condition && error) {
      this._errors.push(`${error}`);
    }
  }

  update() {
    if (!this._init) {
      return;
    }

    if (this.rows[this.rows.length - 1].partName) {
      this.addRow();
    }

    this._errors = [];
    const sums = { ...baseSums };
    let topSpeed = null, enginePower = 0, weaponGroups = 0, habs = 0;
    const reactorPower = this.fixedParts['Reactor'].getValue('power') || 0;
    const reactorClass = this.fixedParts['Reactor'].getValue('class') || 'C';
    const gravPower = this.fixedParts['Grav Drive'].getValue('power');
    for (const row of this.rows) {
      const { partType } = row;
      for (const key in sums) {
        sums[key] = (sums[key] || 0) + (row.getValue(key) || 0);
      }
      for (const error of row.errors) {
        if (!this._errors.includes(error)) {
          this._errors.push(error);
        }
      }
      if (partType === 'Engine') {
        enginePower += row.getValue('power') || 0;
        const speed = row.topSpeed;
        if (!topSpeed || topSpeed > speed) {
          topSpeed = speed;
        }
      } else if (weaponTypes.includes(partType)) {
        weaponGroups++;
      } else if (partType.startsWith('Hab')) {
        habs++;
      }
      let warn = partType !== 'Shield Generator' && row.isFixedType && !row.partName;
      if (warn) {
        this._errors.push(`No ${partType}`);
      }
      if (partType !== 'Reactor' && row.part.class && row.part.class > reactorClass) {
        warn = true;
        this._errors.push(`${row.partName} exceeds reactor class`);
      }
      row._partName.parentElement.classList.toggle('warn', warn);
    }
    sums.power -= reactorPower;

    for (const field in totalFields) {
      ui[field].innerText = sums[totalFields[field]];
    }
    ui.totalCargo.innerText = `${sums.cargo} (${sums.shielded})`;
    ui.totalPower.innerText = `${sums.power} / ${reactorPower}`;
    this._cautionIf('totalPower', sums.power - gravPower > reactorPower);
    this._warnIf('totalFuel', sums.fuel < 1, 'No fuel tanks');

    const { jump, mthrust, mass, landing } = sums;
    const gravRange = formulas.jumpRange(mass, jump);
    const mobility = formulas.mobility(mass, mthrust);
    ui.gravRange.innerText = formulas.roundTo(gravRange, 1000);
    ui.mobility.innerText = formulas.roundTo(mobility, 10);

    const targetGravRange = Number(ui.targetGravRange.value);
    const targetMobility = Number(ui.targetMobility.value);
    const targetGravMass = formulas.maxMassForJump(jump, targetGravRange);
    const targetMobMass = formulas.maxMassForMobility(mthrust, targetMobility);
    this._showTargetAbove('targetGravRange', gravRange, targetGravRange);
    this._showTargetAbove('targetMobility', mobility, targetMobility);
    this._showTargetBelow('targetMass', mass, Math.min(targetGravMass, targetMobMass));
    this._showTargetAbove('targetJump', jump, formulas.minJumpForRange(mass, targetGravRange));
    this._showTargetBelow('speed', Number(ui.targetSpeed.value), topSpeed || 0);
    this._showTargetAbove('targetMThrust', mthrust, formulas.minMThrustForMobility(mass, targetMobility));
    this._showTargetAbove('targetLanding', landing, formulas.minLandingForMass(mass), 'Landing thrust too low');

    if (enginePower > 12) {
      this._errors.push('Engine power too high');
    } else if (enginePower < 1) {
      this._errors.push('No engines');
    }
    if (gravRange < 15) {
      this._errors.push('Grav range too low');
    }
    if (weaponGroups > 3) {
      this._errors.push('Unassignable weapon groups');
    }
    if (habs < 1) {
      this._errors.push('No habs');
    }
    if (this._errors.length) {
      ui.errors.innerHTML = this._errors.map(error => `<li>${error}</li>`).join('\n');
      ui.errors.classList.remove('clean');
    } else {
      ui.errors.innerText = '';
      ui.errors.classList.add('clean');
    }

    this.save();
  }

  moveRowUp(row) {
    const pos = this.rows.indexOf(row);
    if (pos < 7) {
      return;
    }
    const other = this.rows[pos - 1];
    other.row.before(row.row);
    this.rows[pos] = other;
    this.rows[pos - 1] = row;
    this.save();
  }

  moveRowDown(row) {
    const pos = this.rows.indexOf(row);
    if (pos < 0) {
      return;
    }
    const other = this.rows[pos + 1];
    if (!other) {
      return;
    }
    other.row.after(row.row);
    this.rows[pos] = other;
    this.rows[pos + 1] = row;
    this.save();
  }

  deleteRow(row) {
    const pos = this.rows.indexOf(row);
    if (pos < 7) {
      return;
    }
    row.row.remove();
    this.rows.splice(pos, 1);
    this.update();
  }

  updateFilters(onlyRow = null) {
    const hide = {
      A: !ui.filterA.checked,
      B: !ui.filterB.checked,
      C: !ui.filterC.checked,
    };
    const level = Number(ui.filterLevel.value || 60);
    const design = Number(ui.filterDesign.value || 4);
    const piloting = Number(ui.filterPiloting.value || 4);
    const rows = onlyRow ? [onlyRow] : this.rows;
    for (const row of rows) {
      const currentPart = row.partName;
      for (const opt of row._partName.options) {
        const part = allParts[opt.value] || {};
        const unavailable = part.level > level || part.design > design || part.piloting > piloting;
        opt.disabled = unavailable || hide[part.class];
        if (opt.value === currentPart) {
          row._partName.classList.toggle('caution', unavailable);
        }
      }
    }
  }

  updateValue() {
    let totalValue = 0;
    for (const row of this.rows) {
      row._updateField('value');
      totalValue += row.getValue('value') || 0;
    }
    ui.totalValue.innerText = Math.ceil(totalValue);
  }
}

const partTable = new PartTable();

export default partTable;
