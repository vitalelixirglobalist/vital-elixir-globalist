(function () {
  // Inject popup HTML once
  if (document.getElementById('contact-popup-root')) return;

  const popupHTML = `
  <div id="contact-popup-root" class="contact-popup hidden">
    <div class="contact-popup-overlay" onclick="closeContactPopup()"></div>

    <div class="contact-popup-panel">
      <div class="contact-popup-header">
        <span>Connect with our 24*7 Technical Team</span>
        <button onclick="closeContactPopup()" aria-label="Close">&times;</button>
      </div>

      <!-- ICONS (copied from header, behavior unchanged) -->
      <div class="fab-stack popup-fab-stack">
        <a class="fab-icon whatsapp" href="https://wa.me/+918275595850?text=Hello%2C%20I%27d%20like%20to%20inquire%20about%20a%20medicine%20export." target="_blank" aria-label="WhatsApp"></a>
        <a class="fab-icon phone" href="tel:+918275595850" aria-label="Call now"></a>
        <a class="fab-icon sms-primary" href="sms:+918275595850?&body=Hello%2C%20I%27d%20like%20to%20inquire%20about%20a%20medicine%20export." aria-label="SMS"></a>
        <a class="fab-icon sms-secondary" href="sms:+919420059603?&body=Hello%2C%20I%27d%20like%20to%20inquire%20about%20a%20medicine%20export." aria-label="iMessage"></a>
        <a class="fab-icon telegram" href="https://t.me/vitalelixirglobalist" target="_blank" aria-label="Telegram"></a>
        <a class="fab-icon instagram" href="https://ig.me/m/vitalelixirglobalist" target="_blank" aria-label="Instagram"></a>
      </div>
    </div>
  </div>
  `;

  const style = document.createElement('style');
  style.innerHTML = `
    .contact-popup {
      position: fixed;
      inset: 0;
      z-index: 9999;
    }
    .contact-popup.hidden { display: none; }

    .contact-popup-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,.55);
    }

    .contact-popup-panel {
      position: absolute;
      bottom: 1.5rem;
      right: 1.5rem;
      background: #fff;
      border-radius: 1rem;
      width: 280px;
      padding: 1rem;
      box-shadow: 0 20px 50px rgba(0,0,0,.3);
      animation: slideUp .25s ease-out;
    }

    .contact-popup-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 600;
      margin-bottom: .75rem;
    }

    .contact-popup-header button {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
    }

    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `;

  document.body.insertAdjacentHTML('beforeend', popupHTML);
  document.head.appendChild(style);
})();

// Public API
function openContactPopup() {
  document.getElementById('contact-popup-root')?.classList.remove('hidden');
}

function closeContactPopup() {
  document.getElementById('contact-popup-root')?.classList.add('hidden');
}
