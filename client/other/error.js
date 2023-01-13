// This file needs to be as compatible with older browsers as possible, which is
// why I'm not using "let", "const", arrow functions, etc.

// Configure these per site.
var moreInfoURL = "/error";
var errorLogLSKey = "melbpt-errors";
var maxErrors = 10;

var triggered = false;
var loaded = false;

// Detect once the page has loaded, errors after this point display different
// wording.
window.addEventListener("load", function () {
  loaded = true;
});

// Any time an uncaught error occurs.
window.addEventListener("error", function (event) {
  // Only trigger once.
  if (triggered) {
    return;
  }
  triggered = true;

  // If the local storage API is available, save the error to an error log to
  // show on the "more info" page.
  try {
    logError({
      message: event.message,
      file: event.filename,
      type: event.type,
      loaded: loaded,
      when: Date.now(),
    });
  } catch {
    console.warn("Failed to use local storage for error logging.");
  }

  // The message to show in the alert if the error occurs when the page is
  // loading.
  var message =
    "An error occured while loading the page. Reloading the page might fix " +
    "the issue.\n\nWould you like more information?";

  if (loaded) {
    // The message to show in the alert if the error occurs when some event
    // occurs on the page after it's loaded.
    message =
      "An error just occurred. The page will probably begin behaving " +
      "strangely.\n\nWould you like more information?";
  }

  // Show the message and redirect the user if they click "OK".
  if (confirm(message)) {
    window.location.href = moreInfoURL;
  }
});

function logError(error) {
  // Only log if the local storage API is available.
  if (window.localStorage) {
    var save = [error];
    var existing = window.localStorage.getItem(errorLogLSKey);

    // If the log has already been created, attempt to append to the end of it,
    // instead of overriding it. If any error occurs, THEN we'll just override
    // the log.
    if (existing) {
      try {
        var errors = JSON.parse(existing);
        errors.push(error);

        while (errors.length > maxErrors) {
          errors.shift();
        }

        save = errors;
      } catch {
        console.warn("Failed to read existing error log or append to it.");
      }
    }

    // Save the error.
    this.window.localStorage.setItem(errorLogLSKey, JSON.stringify(save));
  }
}
