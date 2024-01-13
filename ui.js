const ui = {};
for (const element of document.querySelectorAll('[id]')) {
  ui[element.id] = element;
}

export function H(tag, children = []) {
  let element;
  if (typeof tag === 'object') {
    element = document.createElement(tag.tag);
    for (let key in tag) {
      if (key === 'className') {
        element.className = tag[key];
      } else if (key != 'tag') {
        element.setAttribute(key, tag[key]);
      }
    }
  } else {
    element = document.createElement(tag);
  }
  if (!Array.isArray(children)) {
    children = [children];
  }
  for (const child of children) {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else {
      element.appendChild(child);
    }
  }
  return element;
}

export default ui;
