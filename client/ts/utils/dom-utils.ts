import { iconSVG } from "./icons";

/**
 * Creates `<div class="{className}"></div>`.
 */
export function domDiv(className: string): HTMLDivElement {
  const element = document.createElement("div");
  element.className = className;
  return element;
}

/**
 * Creates `<button class="{className}"></button>`.
 */
export function domButton(className: string): HTMLButtonElement {
  const element = document.createElement("button");
  element.className = className;
  return element;
}

/**
 * Creates:
 * ```html
 * <label class="{outerClass}">
 *  <input type="radio" name="{groupName}" autocomplete="off">
 *  <div class="{innerClass}">
 *    <p>{text}<p>
 *  </div>`
 * </label>
 * ```
 */
export function domPicker(outerClass: string, innerClass: string,
  groupName: string, text: string) {

  const element = document.createElement("label");
  element.className = outerClass;

  const input = document.createElement("input");
  input.type = "radio";
  input.name = groupName;
  input.autocomplete = "off";

  const div = domDiv(innerClass);
  div.append(domP(text));

  element.append(input, div);

  return {
    label: element,
    radio: input
  };
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
 * Creates:
 * ```html
 * <div class="one-line">
 *  <p class="{className}">{text}</p>
 * </div>
 * ```
 */
export function domOneLineP(text: string,
  className: string | null = null): HTMLDivElement {

  const element = domDiv(`one-line ${className}`);
  element.appendChild(domP(text));
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
 * Creates:
 * ```html
 * <svg class="icon {className}" ...>
 *  [ICON DATA FOR ICON]
 * </svg>
 * ```
 */
export function domIcon(icon: string,
  className: string | null = null): SVGSVGElement {

  const element = iconSVG(icon);
  if (className != null) {
    element.classList.add(...className.split(" "));
  }

  return element;
}

/**
 * Creates `<span class="{className}">{text}</span>`.
 */
export function domSpan(text: string, className: string | null = null): HTMLSpanElement {
  const element = document.createElement("span");
  if (className != null) {
    element.className = className;
  }
  element.textContent = text;
  return element;
}

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
