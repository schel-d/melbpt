export const finder = {
  /**
   * Get any element from the document. Throws an error if the ID is invalid.
   * @param id The ID of the element (without the "#" prefix).
   */
  any: any,

  /**
   * Get a {@link HTMLDivElement} from the document. Throws an error if the ID
   * is invalid or the type is incorrect.
   * @param id The ID of the element (without the "#" prefix).
   */
  div: div,

  /**
   * Get a {@link HTMLAnchorElement} from the document. Throws an error if the
   * ID is invalid or the type is incorrect.
   * @param id The ID of the element (without the "#" prefix).
   */
  anchor: anchor,

  /**
   * Get a {@link HTMLInputElement} from the document. Throws an error if the
   * ID is invalid or the type is incorrect.
   * @param id The ID of the element (without the "#" prefix).
   */
  input: input,

  /**
   * Get a {@link HTMLButtonElement} from the document. Throws an error if the
   * ID is invalid or the type is incorrect.
   * @param id The ID of the element (without the "#" prefix).
   */
  button: button,

  /**
   * Get a {@link HTMLSelectElement} from the document. Throws an error if the
   * ID is invalid or the type is incorrect.
   * @param id The ID of the element (without the "#" prefix).
   */
  select: select,

  /**
   * Get a {@link HTMLCanvasElement} from the document. Throws an error if the
   * ID is invalid or the type is incorrect.
   * @param id The ID of the element (without the "#" prefix).
   */
  canvas: canvas,
};

function any(id: string): HTMLElement {
  const result = document.getElementById(id);
  if (result != null) { return result; }
  throw new Error(`Element with id "#${id}" not found.`);
}

function elementOfType<T extends HTMLElement>(id: string, typeName: string,
  typeChecker: (val: HTMLElement) => boolean): T {

  const result = any(id);
  if (typeChecker(result)) { return result as T; }
  throw new Error(`Element with id "#${id}" is not a "${typeName}".`);
}

function div(id: string): HTMLDivElement {
  return elementOfType<HTMLDivElement>(
    id, "HTMLDivElement", x => x instanceof HTMLDivElement
  );
}
function anchor(id: string): HTMLAnchorElement {
  return elementOfType<HTMLAnchorElement>(
    id, "HTMLAnchorElement", x => x instanceof HTMLAnchorElement
  );
}
function input(id: string): HTMLInputElement {
  return elementOfType<HTMLInputElement>(
    id, "HTMLInputElement", x => x instanceof HTMLInputElement
  );
}
function button(id: string): HTMLButtonElement {
  return elementOfType<HTMLButtonElement>(
    id, "HTMLButtonElement", x => x instanceof HTMLButtonElement
  );
}
function select(id: string): HTMLSelectElement {
  return elementOfType<HTMLSelectElement>(
    id, "HTMLSelectElement", x => x instanceof HTMLSelectElement
  );
}
function canvas(id: string): HTMLCanvasElement {
  return elementOfType<HTMLCanvasElement>(
    id, "HTMLCanvasElement", x => x instanceof HTMLCanvasElement
  );
}
