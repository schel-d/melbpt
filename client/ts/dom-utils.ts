export function domDiv(className: string): HTMLDivElement {
  const element = document.createElement("div");
  element.className = className;
  return element;
}

export function domP(text: string,
  className: string | null = null): HTMLParagraphElement {

  const element = document.createElement("p");
  if (className != null) {
    element.className = className;
  }
  element.textContent = text;
  return element;
}

export function domA(href: string, className: string | null = null): HTMLAnchorElement {
  const element = document.createElement("a");
  if (className != null) {
    element.className = className;
  }
  element.href = href;
  return element;
}

export function domIconify(icon: string,
  className: string | null = null): HTMLSpanElement {

  const element = document.createElement("span");
  if (className == null) {
    element.className = "iconify";
  }
  else {
    element.className = `iconify ${className}`;
  }
  element.dataset.icon = icon;
  return element;
}
