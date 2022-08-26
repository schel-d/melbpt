import { domDiv } from "../dom-utils";

export class OdometerController<T> {
  div: HTMLDivElement;
  in: HTMLElement;
  out: HTMLElement | null;

  currentValue: T;
  equals: (a: T, b: T) => boolean;
  builder: (value: T) => HTMLElement;

  constructor(startValue: T, equals: (a: T, b: T) => boolean,
    builder: (value: T) => HTMLElement) {

    this.div = domDiv("odometer");
    this.in = builder(startValue);
    this.out = null;

    this.currentValue = startValue;
    this.equals = equals;
    this.builder = builder;

    this.div.append(this.in);
    this.in.classList.add("odometer-in");
  }

  update(value: T) {
    if (this.equals(this.currentValue, value)) { return; }

    this.out?.remove();
    this.out = this.in;
    this.out.classList.remove("odometer-in");
    this.out.classList.add("odometer-out");

    this.in = this.builder(value);
    this.in.classList.add("odometer-in");
    this.div.append(this.in);
  }
}
