const siteHeader = document.getElementById("siteHeader");
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");

const handleHeaderState = () => {
  if (!siteHeader) return;
  if (window.scrollY > 16) {
    siteHeader.classList.add("is-scrolled");
  } else {
    siteHeader.classList.remove("is-scrolled");
  }
};

handleHeaderState();
window.addEventListener("scroll", handleHeaderState, { passive: true });

if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    navLinks.classList.toggle("open");
    navToggle.setAttribute(
      "aria-expanded",
      navLinks.classList.contains("open") ? "true" : "false"
    );
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });

  document.addEventListener("click", (event) => {
    const insideMenu = navLinks.contains(event.target);
    const insideToggle = navToggle.contains(event.target);

    if (!insideMenu && !insideToggle) {
      navLinks.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    }
  });
}
