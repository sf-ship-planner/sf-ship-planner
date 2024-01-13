import { allParts, partsByType, fixedParts } from './data.js';
import ui, { H } from './ui.js';
import partTable from './parttable.js';

const topSpeeds = {
  'White Dwarf 3015': 180,
  A: 150,
  B: 140,
  C: 130,
};

function updateFilters(select) {
  const hide = {
    A: !ui.filterA.checked,
    B: !ui.filterB.checked,
    C: !ui.filterC.checked,
  };
  const selects = (select && select.tagName === 'SELECT') ? [select] : [...document.querySelectorAll('select.partName')];
  for (const sel of selects) {
    for (const opt of sel.options) {
      opt.hidden = hide[opt.reactorClass];
    }
  }
}

ui.filterA.addEventListener('click', updateFilters);
ui.filterB.addEventListener('click', updateFilters);
ui.filterC.addEventListener('click', updateFilters);

export default class PartRow {
  constructor(partType = null) {
    this.update = this.update.bind(this);
    this._fillNames = this._fillNames.bind(this);

    const select = document.createElement('select');
    select.className = 'partName';
    select.options.add(document.createElement('option'));
    select.addEventListener('change', this.update);
    this._partName = select;

    let partHeader = `${partType}:`;
    if (partType) {
      this._fixedType = partType;
    } else {
      partHeader = document.createElement('select');
      this._partType = partHeader;
      select.partHeader = partHeader;
      partHeader.className = 'partType';
      partHeader.options.add(document.createElement('option'));
      for (let type in partsByType) {
        if (!fixedParts.includes(type)) {
          const opt = document.createElement('option');
          opt.value = opt.text = type;
          partHeader.options.add(opt);
        }
      }
      partHeader.addEventListener('change', this._fillNames);
    }

    const cells = [ H('th', partHeader) ];
    this.nameCell = H({ tag: 'td', className: 'partName' }, select);
    cells.push(this.nameCell);
    if (fixedParts.includes(partType)) {
      this.nameCell.colSpan = 2;
    } else {
      this._qty = H({
        tag: 'input',
        type: 'number',
        className: 'qty',
        value: 1,
        min: 1,
        max: 6,
      });
      cells.push(H('td', ['x', this._qty]));
      this._qty.addEventListener('change', this.update);
    }
    cells.push(
      this._value = H({ tag: 'td', className: 'value' }),
      this._mass = H({ tag: 'td', className: 'mass' }),
      this._hull = H({ tag: 'td', className: 'hull' }),
      this._power = H({ tag: 'td', className: 'power' }),
      this._thrust = H({ tag: 'td', className: 'thrust' }),
      this._capacity = H({ tag: 'td', className: 'capacity' }),
    )

    this._fillNames();
    this.row = H('tr', cells);
    ui.mainTable.appendChild(this.row);
    this._init = true;
    this.errors = [];
  }

  get isFixedType() {
    return !!this._fixedType;
  }

  get partType() {
    if (this._fixedType) {
      return this._fixedType;
    }
    return this._partType.value;
  }

  set partType(v) {
    const oldValue = this.partType;
    if (v === oldValue) {
      return;
    }
    if (this._partType) {
      this._partType.value = v;
    }
    this._fillNames();
  }

  get partName() {
    return this._partName.value;
  }

  set partName(v) {
    this._partName.value = v;
  }

  get quantity() {
    if (this._qty) {
      return Number(this._qty.value) || 1;
    }
    return 1;
  }

  set quantity(v) {
    if (this._qty) {
      this._qty.value = v;
    }
  }

  get part() {
    return allParts[this.partName] || {};
  }

  getValue(field) {
    let value = this.part[field];
    if (typeof value === 'number') {
      value *= this.quantity;
    }
    return value;
  }

  get topSpeed() {
    if (this.partType !== 'Engine') {
      return null;
    }
    return topSpeeds[this.partName] || topSpeeds[this.part.class];
  }

  _fillNames() {
    const options = this._partName.options;
    while (options.length) {
      options.remove(options.length - 1);
    }
    options.add(H('option'));
    for (const name in partsByType[this.partType] || []) {
      const opt = document.createElement('option');
      opt.value = opt.text = name;
      const part = allParts[name];
      if (part && part.class) {
        opt.reactorClass = part.class;
        opt.text = `${name} (${part.class})`;
      }
      options.add(opt);
    }
    this.update();
    updateFilters(this._partName);
  }

  _updateField(field, value = null) {
    if (value === null) {
      value = this.getValue(field);
    }
    const element = this['_' + field];
    element.innerText = value || '';
    if (field === 'power' && this.partType !== 'Reactor') {
      element.classList.toggle('warn', value > 12);
      if (value > 12) {
        this.errors.push(`Too many ${this.partName}`);
      }
    }
  }

  update() {
    const data = this.part;
    const qty = this.quantity;
    let thrust = '';
    if (data.thrust) {
      thrust = `${qty * data.thrust} / ${qty * data.mthrust}`;
    } else if (data.jump) {
      thrust = `Grav: ${data.jump}`;
    } else if (data.landing) {
      thrust = `Landing: ${qty * data.landing}`;
    }

    this.errors = [];
    this._updateField('value');
    this._updateField('mass');
    this._updateField('hull');
    this._updateField('power');
    this._updateField('capacity', data.fuel || data.cargo);
    this._updateField('thrust', thrust);

    if (this._init) {
      partTable.update();
    }
  }
}