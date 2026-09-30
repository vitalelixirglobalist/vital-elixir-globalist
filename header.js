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

  document.querySelectorAll('a[href^="/"]').forEach(link => {
    const fixed = link.getAttribute("href").replace(/^\//, "");

    if (!fixed.endsWith(".html") && !fixed.includes("#")) {
      link.setAttribute("href", fixed + ".html");
    } else {
      link.setAttribute("href", fixed);
    }
  });
};