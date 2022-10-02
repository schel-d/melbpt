import { getNetwork } from "../../utils/network";

/**
 * How long before a word is culled from the list.
 */
const wordMaxLife = 1000;

/**
 * How long (in age points) a word takes to fade in after creation.
 */
const fadeInTime = 50;

/**
 * How long (in age points) a word takes to fade out before deletion.
 */
const fadeOutTime = 50;

/**
 * The rate to zoom in the canvas's "camera".
 */
const zoomSpeed = 0.0005;

/**
 * How far the canvas is allowed to zoom before the animation resets. This stops
 * the kerning going weird at ever increasing zoom levels (in firefox), and
 * hopefully means the animation can run forever.
 */
const zoomReset = 10;

/**
 * The maximum number of words ever allowed on the canvas. Not used directly,
 * but together with wordMaxLife, controls the rate new words are added.
 */
const maxWords = 50;

/**
 * Words that aren't this far apart from each other are considered as colliding.
 */
const wordCollisionBuffer = 5;

/**
 * How much of the canvas's largest dimension should be valid word spawning
 * area.
 */
const wordGenerationArea = 0.8;

/**
 * The percentage of the canvas's height to use in the gradients blending it
 * into the navbar and content beneath.
 */
const gradientSize = 0.05;

/**
 * Shifts the spawn area slightly down from the center so that more words spawn
 * below the logo because there's more space there.
 */
const verticalOffset = 0.3;

/**
 * A shortcut for writing {@link CanvasRenderingContext2D}.
 */
type Context = CanvasRenderingContext2D;

/**
 * The current list of words on the canvas and the zoom level.
 */
type State = { words: Word[], zoom: number };

/**
 * An object holding the color strings extracted from the CSS.
 */
type Colors = {
  text: string, bg: string, bgTransparent: string
}

/**
 * The data associated with each word displaying on the canvas.
 */
type Word = {
  text: string, x1: number, x2: number, y1: number, y2: number, size: number,
  age: number
};

/**
 * Starts the background animation (floating stop names) inside the given
 * canvas.
 * @param canvas The canvas to animate inside.
 * @param heroDiv The hero div element that the words should appear to be
 * emanating from.
 */
export function initHeroBG(canvas: HTMLCanvasElement, heroDiv: HTMLElement) {
  const context = canvas.getContext("2d");
  if (context == null) {
    throw new Error("Canvas context for hero-bg was null.");
  }

  const colors = getColors(canvas);

  getNetwork()
    .then((network) => {
      // If the network information is sucessfully retrieved, extract the stop
      // names from it.
      const stopNames = network.stops.map(s => s.name);

      // Start with no words and zoom level of 1.
      const state: State = {
        words: [],
        zoom: 1
      };

      // Size the canvas appropriately, then begin the draw loop.
      adjustSize(canvas, context);
      window.requestAnimationFrame(() =>
        draw(canvas, context, stopNames, state, true, heroDiv, colors)
      );

      // If the canvas resizes, fix the resolution and draw one frame. Loop is
      // set to false to ensure this draw call does not request it's own
      // animation frames. This is a one-off draw call. The loop begun above
      // will continue running.
      new ResizeObserver(() => {
        adjustSize(canvas, context);
        draw(canvas, context, stopNames, state, false, heroDiv, colors);
      }).observe(canvas);
    })
    .catch(() => {
      // If an error occurs log it. Otherwise I might never notice because the
      // background is fairly subtle!
      const msg = "Cannot animate background. Failed to get stop names.";
      console.error(msg);
    });
}
/**
 * Retrieve the colors used in the CSS. Note that we can't just use
 * "transparent" for the transparent color because the gradient is blended badly
 * on Chrome for Android (at least) because it blends to #000000 rather than
 * just adjusting alpha.
 */
function getColors(canvas: HTMLCanvasElement): Colors {
  const style = getComputedStyle(canvas);
  const textColor = style.getPropertyValue("color");
  const bgColor = style.getPropertyValue("background-color");

  const colors: Colors = {
    text: textColor,
    bg: bgColor,
    bgTransparent: bgColor.replace(")", ", 0)")
  };

  window.addEventListener("pageshow", (e) => {
    // Event runs when page is restored from bfcache. Replaces values in
    // existing colors object so everyone with a reference to this object gets
    // the changes.
    if (e.persisted) {
      const style = getComputedStyle(canvas);
      const textColor = style.getPropertyValue("color");
      const bgColor = style.getPropertyValue("background-color");
      colors.text = textColor;
      colors.bg = bgColor;
      colors.bgTransparent = bgColor.replace(")", ", 0)");
    }
  });

  return colors;
}

/**
 * Draw one frame of animation. Also responsible for updating state.
 * @param canvas The canvas to draw to.
 * @param context The canvas context to use for drawing.
 * @param stopNames The stop names to display in the animation.
 * @param state The current list of words and zoom level for this function to
 * operate on and modify.
 * @param loop Whether or not this function should register itself for the next
 * animation frame.
 * @param heroDiv The hero div element that the words should appear to be
 * emanating from.
 * @param colors The colors to use, extracted from the CSS.
 */
function draw(canvas: HTMLCanvasElement, context: Context, stopNames: string[],
  state: State, loop: boolean, heroDiv: HTMLElement, colors: Colors) {

  // Zoom in at a constant rate.
  // Todo: Calculate delta properly?
  const delta = 1;
  state.zoom *= 1 + zoomSpeed;

  // Age each word and delete the ones that get too old.
  state.words.forEach(w => w.age += delta);
  const wordsToRemove = state.words.filter(w => w.age > wordMaxLife);
  wordsToRemove.forEach(w => state.words.splice(state.words.indexOf(w), 1));

  const dpi = calculateDpiRatio(context);

  // Clear the screen.
  context.resetTransform();
  context.clearRect(0, 0, canvas.width, canvas.height);

  // Transform the coordinates properly to achieve zooming in effect.
  const animationCenterY = (heroDiv.offsetTop + heroDiv.clientHeight / 2) * dpi;
  context.translate(canvas.width / 2, animationCenterY);
  context.scale(state.zoom, state.zoom);

  // Draw every word onto the canvas.
  context.fillStyle = colors.text;
  state.words.forEach(w => {
    setFontSize(context, w.size);
    context.globalAlpha = wordAlpha(w.age);
    context.fillText(w.text, w.x1, w.y1);
  });
  context.globalAlpha = 1;

  // Unless we added a word too recently or we're in the reset phase, add
  // another word.
  if (state.zoom < zoomReset && (state.words.length == 0 ||
    state.words[state.words.length - 1].age >= wordMaxLife / maxWords)) {
    const newWord = generateWord(
      stopNames, context, state.zoom, Math.max(canvas.width, canvas.height)
    );

    // Only actually add the word if there isn't already one in its way. If
    // there is, do nothing and try again next frame.
    if (!state.words.some(w => wordsCollide(w, newWord, dpi))) {
      state.words.push(newWord);
    }
  }

  // Once the zoom level exceeds a certain point words will stop generating.
  // This allows us to reset back to zoom level 1. This stops the kerning going
  // weird at ever increasing zoom levels (in firefox), and hopefully means the
  // animation can run forever.
  if (state.zoom >= zoomReset && state.words.length == 0) {
    state.zoom = 1;
  }

  drawEdgeGradients(canvas, context, colors);

  // If this draw call wasn't called from a resize event, then it should call
  // itself again for the next frame.
  if (loop) {
    window.requestAnimationFrame(() =>
      draw(canvas, context, stopNames, state, true, heroDiv, colors)
    );
  }
}

/**
 * Draws the gradients on the top and bottom to blend the background into it's
 * boundaries.
 * @param canvas The canvas to draw to.
 * @param context The canvas context to use for drawing.
 * @param colors The colors to use, extracted from the CSS.
 */
function drawEdgeGradients(canvas: HTMLCanvasElement, context: Context,
  colors: Colors) {

  context.resetTransform();

  // Draw top gradient
  const grad1Y1 = 0;
  const grad1Y2 = canvas.height * gradientSize;
  const grad1 = context.createLinearGradient(0, 0, 0, grad1Y2);
  grad1.addColorStop(0, colors.bg);
  grad1.addColorStop(1, colors.bgTransparent);
  context.fillStyle = grad1;
  context.fillRect(0, grad1Y1, canvas.width, grad1Y2 - grad1Y1);

  // Draw bottom gradient
  const grad2Y1 = canvas.height * (1 - gradientSize);
  const grad2Y2 = canvas.height * 1;
  const gradient = context.createLinearGradient(0, grad2Y1, 0, grad2Y2);
  gradient.addColorStop(0, colors.bgTransparent);
  gradient.addColorStop(1, colors.bg);
  context.fillStyle = gradient;
  context.fillRect(0, grad2Y1, canvas.width, grad2Y2 - grad2Y1);
}

/**
 * Returns which alpha value should be used for a word of this age.
 * @param age The age of the word.
 */
function wordAlpha(age: number): number {
  if (age > wordMaxLife || age < 0) { return 0; }
  if (age < fadeInTime) { return age / fadeInTime; }
  if (age > wordMaxLife - fadeOutTime) { return (wordMaxLife - age) / fadeOutTime; }
  return 1;
}

/**
 * Determines whether these two word objects are too close to each other.
 * @param a A word.
 * @param b A second word.
 * @param dpi The DPI as returned by {@link calculateDpiRatio}.
 */
function wordsCollide(a: Word, b: Word, dpi: number): boolean {
  const buffer = Math.max(a.size, b.size) * wordCollisionBuffer * dpi;

  return !(a.x2 < b.x1 - buffer || a.y2 < b.y1 - buffer ||
    a.x1 > b.x2 + buffer || a.y1 > b.y2 + buffer);
}

/**
 * Generates a random word in a random position. Does not check for collisions.
 * @param stopNames The list of stop names to pick from.
 * @param context The canvas context used to measure text size.
 * @param zoom The zoom level as per the state object.
 * @param canvasSize The size of the largest dimension on the canvas.
 */
function generateWord(stopNames: string[], context: Context, zoom: number,
  canvasSize: number): Word {

  const size = 1 / zoom;
  const text = stopNames[Math.floor(stopNames.length * Math.random())] ?? "";
  const x1 = (Math.random() - 0.5) * canvasSize * wordGenerationArea / zoom;
  const y1 = (Math.random() - verticalOffset) * canvasSize * wordGenerationArea / zoom;

  setFontSize(context, size);
  const x2 = x1 + context.measureText(text).width;

  // Multiplied by 16 to convert from rem to px.
  const y2 = y1 + 16 * calculateDpiRatio(context);

  return { text: text, x1: x1, x2: x2, y1: y1, y2: y2, size: size, age: 0 };
}

/**
 * Sets the font size on the canvas context object provided. Takes DPI into
 * account.
 * @param context The canvas context object.
 * @param size The desired font size.
 */
function setFontSize(context: Context, size: number) {
  context.font = (size * calculateDpiRatio(context)).toString() + "em Poppins";
}

/**
 * Adjusts the resolution of the canvas to match it's size, so nothing appears
 * pixelated or stretched.
 * @param canvas The canvas.
 * @param context The canvas context, used to calculate DPI.
 */
function adjustSize(canvas: HTMLCanvasElement, context: Context) {
  const dpiRatio = calculateDpiRatio(context);
  canvas.width = canvas.clientWidth * dpiRatio;
  canvas.height = canvas.clientHeight * dpiRatio;
}

/**
 * Returns the scaling factor for things rendered to the canvas, so that they
 * appear consistently sized across all devices.
 * @param context The canvas context object.
 */
function calculateDpiRatio(context: Context): number {
  const dpr = window.devicePixelRatio || 1;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bsr = (context as any).backingStorePixelRatio || 1;
  return dpr / bsr;
};
