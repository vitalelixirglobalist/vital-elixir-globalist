(function () {
  const CURRENCY_KEY = 'selectedCurrency';
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
    const rate = rates[currency] || 1;
    return Number(amount || 0) * rate;
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

  window.currencyUtils = {
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
