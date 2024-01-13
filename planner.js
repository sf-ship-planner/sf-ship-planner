import partTable from './parttable.js';
import loadData from './data.js';

window.addEventListener('load', async () => {
  await loadData();
  partTable.init();
  partTable.load();
});
