import { allParts } from './data.js';
import Modal from './modal.js';

class SearchModal extends Modal {
  constructor() {
    super('searchModal');
  }

  show(row) {
    this.ui.partType.innerText = row.partType;
    super.show();
  }
};

const searchModal = new SearchModal();
export default searchModal;
