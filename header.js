window.initHeader = function () {
  const CONTACT_NUMBER = "+918275595850";

  document.querySelectorAll("[data-contact-number]").forEach(link => {
    link.href = `tel:${CONTACT_NUMBER}`;
  });

  const menuBtn = document.getElementById("menu-btn");
  const closeBtn = document.getElementById("close-menu");
  const mobileMenu = document.getElementById("mobile-menu");
  const sidebar = document.getElementById("sidebar");

  if (menuBtn && sidebar && mobileMenu) {
    menuBtn.onclick = () => {
      mobileMenu.classList.remove("hidden");

      setTimeout(() => {
        sidebar.classList.remove("translate-x-full");
        sidebar.scrollTop = 0;
      }, 10);
    };

    closeBtn.onclick = () => {
      sidebar.classList.add("translate-x-full");

      setTimeout(() => {
        mobileMenu.classList.add("hidden");
      }, 300);
    };

    mobileMenu.onclick = (e) => {
      if (e.target === mobileMenu) {
        sidebar.classList.add("translate-x-full");

        setTimeout(() => {
          mobileMenu.classList.add("hidden");
        }, 300);
      }
    };
  }

  // Navigation links retain their extensionless URLs.
};

// Display clean URLs for visitors following older .html bookmarks.
// The original .html files remain available on the hosting server.
(function cleanLegacyPageUrl() {
  const path = window.location.pathname;
  if (!/\.html$/i.test(path)) return;
  const cleanPath = path.replace(/\/index\.html$/i, "/").replace(/\.html$/i, "");
  window.history.replaceState(
    window.history.state,
    "",
    cleanPath + window.location.search + window.location.hash
  );
})();
