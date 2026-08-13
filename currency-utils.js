(function () {
  const CURRENCY_KEY = 'selectedCurrency';

  // Global price control. pricing-engine.js is the only file that applies it.
  const GLOBAL_PRICE_INCREASE_PERCENT = 0.01;

  const rates = {
    USD: 1,
    GBP: 0.79,
    EUR: 0.92,
    CAD: 1.36,
    AUD: 1.52,
    GHS: 12.0
  };

  const defaultCurrency = 'USD';

  function getSelectedCurrency() {
    return localStorage.getItem(CURRENCY_KEY) || defaultCurrency;
  }

  function setSelectedCurrency(currency) {
    if (!rates[currency]) return;
    localStorage.setItem(CURRENCY_KEY, currency);
    document.dispatchEvent(new CustomEvent('currency:change', { detail: { currency } }));
  }

  function convertFromUsd(amount, currency) {
    const baseAmount = Number(amount || 0);
    const rate = rates[currency] || 1;
    return baseAmount * rate;
  }

  function formatCurrency(amount, currency) {
    return `${currency} ${Number(amount || 0).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`;
  }

    function initCurrencySelect() {
    const desktopSelect = document.getElementById('currencySelect');
    const mobileSelect = document.getElementById('currencySelectMobileTop');
    const selects = [desktopSelect, mobileSelect].filter(Boolean);
    if (!selects.length) return;
    const currentCurrency = getSelectedCurrency();
    selects.forEach((select) => {
      select.value = currentCurrency;
      if (select.dataset.currencyBound === 'true') return;
      select.dataset.currencyBound = 'true';
      select.addEventListener('change', (event) => {
        const nextCurrency = event.target.value;

        if (!rates[nextCurrency]) return;

        // Keep desktop + mobile selectors synchronized
        selects.forEach((otherSelect) => {
          otherSelect.value = nextCurrency;
        });

        if (nextCurrency === getSelectedCurrency()) return;

        // Save selected currency permanently in browser
        setSelectedCurrency(nextCurrency);

        // Reload page so all prices update
        window.location.reload();
      });
    });
  }

  window.currencyUtils = {
    GLOBAL_PRICE_INCREASE_PERCENT,
    rates,
    getSelectedCurrency,
    setSelectedCurrency,
    convertFromUsd,
    formatCurrency
  };

  window.initCurrencySelect = initCurrencySelect;

  document.addEventListener('DOMContentLoaded', () => {
    initCurrencySelect();
  });
})();
