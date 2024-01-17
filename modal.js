import ui from './ui.js';

function hideModals(event) {
  if (event && event.target !== ui.modalBase) {
    return;
  }
  for (const modal of document.querySelectorAll('#modalBase > div')) {
    modal.style.display = 'none';
  }
  ui.modalBase.style.display = 'none';
}

export default class Modal {
  constructor(rootId) {
    this._rootId = rootId;
    this.ui = {};
    window.addEventListener('load', () => this.init());
  }

  _fillUi() {
    for (const element of ui[this._rootId].querySelectorAll('[data-key]')) {
      this.ui[element.dataset.key] = element;
    }
  }

  init() {
    this._fillUi();
  }

  show() {
    ui[this._rootId].style.display = '';
    ui.modalBase.style.display = '';
  }

  hide() {
    hideModals();
  }
}

window.addEventListener('load', () => {
  ui.modalBase.addEventListener('click', hideModals);
  hideModals();
});
