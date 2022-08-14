/**
 * Creates `<div class="{className}"></div>`.
 */
export function domDiv(className: string): HTMLDivElement {
  const element = document.createElement("div");
  element.className = className;
  return element;
}

/**
 * Creates `<p class="{className}">{text}</p>`.
 */
export function domP(text: string,
  className: string | null = null): HTMLParagraphElement {

  const element = document.createElement("p");
  if (className != null) {
    element.className = className;
  }
  element.textContent = text;
  return element;
}

/**
 * Creates `<h1 class="{className}">{text}</p>`.
 */
export function domH1(text: string,
  className: string | null = null): HTMLParagraphElement {

  const element = document.createElement("h1");
  if (className != null) {
    element.className = className;
  }
  element.textContent = text;
  return element;
}

/**
 * Creates `<h2 class="{className}">{text}</p>`.
 */
export function domH2(text: string,
  className: string | null = null): HTMLParagraphElement {

  const element = document.createElement("h2");
  if (className != null) {
    element.className = className;
  }
  element.textContent = text;
  return element;
}

/**
 * Creates `<h3 class="{className}">{text}</p>`.
 */
export function domH3(text: string,
  className: string | null = null): HTMLParagraphElement {

  const element = document.createElement("h3");
  if (className != null) {
    element.className = className;
  }
  element.textContent = text;
  return element;
}

/**
 * Creates `<a href="{href}" class="{className}"></a>`.
 */
export function domA(href: string,
  className: string | null = null): HTMLAnchorElement {

  const element = document.createElement("a");
  if (className != null) {
    element.className = className;
  }
  element.href = href;
  return element;
}

/**
 * Creates `<span class="iconify {className}" data-icon="{icon}"></span>`.
 */
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

/**
 * Returns the reference to a html element based on its ID in the DOM. Throws an
 * exception if no element with that ID is found.
 * @param id The ID of the html element.
 */
export function getElementOrThrow(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (element != null) { return element; }
  throw new Error(`Element not found: #${id}`);
};

/**
 * Returns the reference to an input element based on its ID in the DOM. Throws
 * an exception if no element with that ID is found, or it isn't an input.
 * @param id The ID of the input element.
 */
export function getInputOrThrow(id: string): HTMLInputElement {
  const element = getElementOrThrow(id);
  if (element instanceof HTMLInputElement) { return element; }
  throw new Error(`Element not an input: #${id}`);
};

/**
 * Returns the reference to a canvas element based on its ID in the DOM. Throws
 * an exception if no element with that ID is found, or it isn't a canvas.
 * @param id The ID of the canvas element.
 */
export function getCanvasOrThrow(id: string): HTMLCanvasElement {
  const element = getElementOrThrow(id);
  if (element instanceof HTMLCanvasElement) { return element; }
  throw new Error(`Element not a canvas: #${id}`);
};

/**
 * Either adds the class to the html element if the {@link switchValue} is true,
 * or removes the class otherwise. Does nothing if the class is already in the
 * desired state.
 * @param element The element to add/remove the class from.
 * @param className The class name.
 * @param switchValue True to add the class, false to remove it.
 */
export function setDomClass(element: HTMLElement, className: string,
  switchValue: boolean) {

  if (switchValue) { element.classList.add(className); }
  else { element.classList.remove(className); }
}
