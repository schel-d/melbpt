export function createLoadingSpinner(className: string) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.classList.add(className);
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", "1");
  svg.setAttribute("height", "1");

  const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
  title.textContent = "Loading spinner";

  const circle1 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle1.setAttribute("cx", "8");
  circle1.setAttribute("cy", "8");
  circle1.setAttribute("r", "2");
  circle1.setAttribute("fill", "currentColor");

  const circle2 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle2.setAttribute("cx", "16");
  circle2.setAttribute("cy", "8");
  circle2.setAttribute("r", "2");
  circle2.setAttribute("fill", "currentColor");

  const circle3 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle3.setAttribute("cx", "16");
  circle3.setAttribute("cy", "16");
  circle3.setAttribute("r", "2");
  circle3.setAttribute("fill", "currentColor");

  const circle4 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle4.setAttribute("cx", "8");
  circle4.setAttribute("cy", "16");
  circle4.setAttribute("r", "2");
  circle4.setAttribute("fill", "currentColor");

  svg.appendChild(title);
  svg.appendChild(circle1);
  svg.appendChild(circle2);
  svg.appendChild(circle3);
  svg.appendChild(circle4);

  return svg;
}
