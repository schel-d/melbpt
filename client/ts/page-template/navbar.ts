let blendMode = true;
let hamburgerOpen = false;

function updateBlendMode(navbar: HTMLElement) {
  const newBlendMode = window.scrollY < 1 && !hamburgerOpen;

  if (blendMode != newBlendMode) {
    blendMode = newBlendMode;

    if (blendMode) { navbar.classList.add("blend"); }
    else { navbar.classList.remove("blend"); }
  }
}
function updateHamburgerMenu(hamburgerMenu: HTMLElement) {
  if (!hamburgerOpen) { hamburgerMenu.classList.add("gone"); }
  else { hamburgerMenu.classList.remove("gone"); }
}

export function initNavbar() {
  const navbar = document.getElementById("navbar");
  const hamburgerButton = document.getElementById("navbar-hamburger-button");
  const hamburgerMenu = document.getElementById("navbar-hamburger-menu");
  if (navbar == null || hamburgerButton == null || hamburgerMenu == null) {
    console.error("Cannot find navbar/hamburger button/hamburger menu.");
    return;
  }

  window.addEventListener("scroll", () => {
    updateBlendMode(navbar);
  });

  hamburgerButton.addEventListener("click", () => {
    hamburgerOpen = !hamburgerOpen;
    updateBlendMode(navbar);
    updateHamburgerMenu(hamburgerMenu);
  });

  updateBlendMode(navbar);
}
