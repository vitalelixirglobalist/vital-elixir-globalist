(function () {
  const CURRENCY_KEY = 'selectedCurrency';
  const PRICE_INCREASE_KEY = 'priceIncreasePercent';

  const rates = {
    USD: 1,
    GBP: 0.79,
    EUR: 0.92,
    CAD: 1.36,
    AUD: 1.52,
    GHS: 12.0
  };

  const defaultCurrency = 'USD';

  // ================================
  // 🔹 PRICE INCREASE CONTROL
  // ================================
  function getPriceIncreasePercent() {
    return Number(localStorage.getItem(PRICE_INCREASE_KEY)) || 0;
  }

  function setPriceIncreasePercent(percent) {
    localStorage.setItem(PRICE_INCREASE_KEY, percent);
    document.dispatchEvent(new CustomEvent('price:change', { detail: { percent } }));
  }

  function applyPriceIncrease(amount) {
    const percent = getPriceIncreasePercent();
    return Number(amount) * (1 + percent / 100);
  }

  // ================================
  // 🔹 CURRENCY FUNCTIONS
  // ================================
  function getSelectedCurrency() {
    return localStorage.getItem(CURRENCY_KEY) || defaultCurrency;
  }

  function setSelectedCurrency(currency) {
    if (!rates[currency]) return;
    localStorage.setItem(CURRENCY_KEY, currency);
    document.dispatchEvent(new CustomEvent('currency:change', { detail: { currency } }));
  }

  function convertFromUsd(amount, currency) {
    const increasedAmount = applyPriceIncrease(amount); // 🔥 APPLY INCREASE HERE
    const rate = rates[currency] || 1;
    return increasedAmount * rate;
  }

  function formatCurrency(amount, currency) {
    return `${currency} ${Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }

  function initCurrencySelect() {
    const select = document.getElementById('currencySelect');
    if (!select || select.dataset.currencyBound === 'true') return;
    select.dataset.currencyBound = 'true';
    select.value = getSelectedCurrency();

    select.addEventListener('change', (event) => {
      const nextCurrency = event.target.value;
      if (nextCurrency === getSelectedCurrency()) return;
      setSelectedCurrency(nextCurrency);
      window.location.reload();
    });
  }

  // ================================
  // 🔹 SIMPLE UI BUTTON (AUTO ADD)
  // ================================
  function initPriceControlUI() {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.bottom = '20px';
    container.style.right = '20px';
    container.style.background = '#fff';
    container.style.border = '1px solid #ccc';
    container.style.padding = '10px';
    container.style.borderRadius = '8px';
    container.style.zIndex = '9999';
    container.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';

    container.innerHTML = `
      <div style="font-size:12px; margin-bottom:5px;">Price Increase %</div>
      <input id="priceIncreaseInput" type="number" placeholder="Enter %" style="width:80px; padding:4px; margin-right:5px;" />
      <button id="applyPriceBtn" style="padding:5px 8px; background:#2563eb; color:white; border:none; border-radius:4px; cursor:pointer;">
        Apply
      </button>
    `;

    document.body.appendChild(container);

    const input = document.getElementById('priceIncreaseInput');
    const btn = document.getElementById('applyPriceBtn');

    input.value = getPriceIncreasePercent();

    btn.addEventListener('click', () => {
      const value = Number(input.value) || 0;
      setPriceIncreasePercent(value);
      alert(`Prices increased by ${value}%`);
      window.location.reload();
    });
  }

  // ================================
  // 🔹 GLOBAL EXPORT
  // ================================
  window.currencyUtils = {
    rates,
    getSelectedCurrency,
    setSelectedCurrency,
    convertFromUsd,
    formatCurrency,
    getPriceIncreasePercent,
    setPriceIncreasePercent
  };

  window.initCurrencySelect = initCurrencySelect;

  document.addEventListener('DOMContentLoaded', () => {
    initCurrencySelect();
    initPriceControlUI(); // 🔥 AUTO LOAD BUTTON
  });

})();
