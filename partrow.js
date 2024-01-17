import { allParts, partsByType, fixedParts, topSpeeds } from './data.js';
import ui, { H } from './ui.js';
import partTable from './parttable.js';
import searchModal from './searchmodal.js';

const upArrow = '<a class="icon up" title="Move Up">&#x2b06;&#xfe0f;</a>';
const downArrow = '<a class="icon down" title="Move Down">&#x2b07;&#xfe0f;</a>';
const delButton = '<a class="icon del" title="Delete">&#x274c;</a>';
const searchButton = '<a class="icon search" title="Search">&#x1f50d;</a>';

export default class PartRow {
  constructor(partType = null) {
    this.update = this.update.bind(this);
    this._fillNames = this._fillNames.bind(this);
    this._onIconClicked = this._onIconClicked.bind(this);

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

    const icons = H({ tag: 'td', className: 'icons' });
    this._info = H({ tag: 'a', className: 'icon info', title: 'Part Info' }, '\u{1f6c8}'),
    icons.addEventListener('click', this._onIconClicked);
    this._info.addEventListener('click', this._onIconClicked);
    this.nameCell = H({ tag: 'td', className: 'partName' }, [ select, /*this._info*/ ]);

    const cells = [ icons, H('th', partHeader), this.nameCell ];
    if (fixedParts.includes(partType)) {
      //icons.innerHTML = searchButton;
      this.nameCell.colSpan = 2;
    } else {
      icons.innerHTML = upArrow + downArrow + delButton /* + searchButton */;
      this._qty = H({
        tag: 'input',
        type: 'number',
        className: 'qty',
        value: 1,
        min: 1,
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

    this.row = H('tr', cells);
    this._fillNames();
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
    if (field === 'value') {
      value = Math.ceil(value * (1.0 - (Number(ui.discount.value) * .01)));
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
        opt.text = `${name} (${part.class})`;
      }
      options.add(opt);
    }
    this.update();
    partTable.updateFilters(this);
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

    this.row.classList.toggle('noSearch', !this.partType);

    if (this._init) {
      partTable.update();
    }
  }

  _onIconClicked(event) {
    if (!event.target.classList.contains('icon')) {
      return;
    }
    event.preventDefault();
    const button = event.target.className.replace('icon ', '');
    switch (button) {
      case 'up': return partTable.moveRowUp(this);
      case 'down': return partTable.moveRowDown(this);
      case 'del': return partTable.deleteRow(this);
      case 'search': return this.showSearch();
      case 'info': return this.showInfo();
    }
  }

  showSearch() {
    if (!this.partType) {
      return;
    }
    searchModal.show(this);
  }

  showInfo() {
    if (!this.partName) {
      return;
    }
    infoModal.show(this);
  }
}
