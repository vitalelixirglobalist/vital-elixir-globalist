(function () {

  if (
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1"
  ) {

    const style = document.createElement("style");

    style.innerHTML = `

      html, body {
        zoom: 100% !important;
        font-size: 16px !important;
      }

      .fab-stack,
      .popup-fab-stack,
      .floating-action-bar {
        transform: none !important;
        scale: 1 !important;
        zoom: 1 !important;
      }

      .fab-icon {
        width: 48px !important;
        height: 48px !important;
      }

      .fab-icon svg,
      .fab-icon img,
      svg {
        width: 22px !important;
        height: 22px !important;
        max-width: 22px !important;
        max-height: 22px !important;
      }

      .site-logo img {
        height: 55px !important;
        width: auto !important;
      }

    `;

    document.head.appendChild(style);

    console.log("✔ DEV FIX ACTIVE");

  }

})();