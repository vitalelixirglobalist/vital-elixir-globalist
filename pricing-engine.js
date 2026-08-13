(function (root, factory) {
  const engine = factory(root);

  if (typeof module === 'object' && module.exports) {
    module.exports = engine;
  }

  root.pricingEngine = engine;
})(typeof window !== 'undefined' ? window : globalThis, function (root) {
  const DEFAULT_SHIPPING_USD = 35;
  const DEFAULT_CURRENCY = 'USD';

  const getCurrencyUtils = () => root.currencyUtils || {};

  const toNumber = (value, fallback = 0) => {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  };

  const roundMoney = (value) => Number(toNumber(value).toFixed(2));

  const readValue = (item, key, fallback = 0) => {
    if (item?.raw?.[key] !== undefined && item.raw[key] !== null) {
      return toNumber(item.raw[key], fallback);
    }

    if (item?.[key] !== undefined && item[key] !== null) {
      return toNumber(item[key], fallback);
    }

    return fallback;
  };

  function getDisplayedCurrency() {
    return getCurrencyUtils().getSelectedCurrency?.() || DEFAULT_CURRENCY;
  }

  function getGlobalIncreasePercent() {
    return toNumber(getCurrencyUtils().GLOBAL_PRICE_INCREASE_PERCENT, 0);
  }

  function getQuantity(item, quantityOverride) {
    const candidate =
      quantityOverride ??
      item?.quantity ??
      item?.qty ??
      item?.count ??
      1;

    return Math.max(1, toNumber(candidate, 1));
  }

  function convertUsdToCurrency(amount, currency = getDisplayedCurrency()) {
    const rate = toNumber(getCurrencyUtils().rates?.[currency], 1);
    return roundMoney(toNumber(amount) * rate);
  }

  function formatCurrencyAmount(amount, currency = getDisplayedCurrency(), options = {}) {
    const minimumFractionDigits = options.minimumFractionDigits ?? 2;
    const maximumFractionDigits = options.maximumFractionDigits ?? 2;

    return `${currency} ${toNumber(amount).toLocaleString('en-US', {
      minimumFractionDigits,
      maximumFractionDigits
    })}`;
  }

  function formatLocalAmount(amountUsd, options = {}) {
    const currency = getDisplayedCurrency();
    return formatCurrencyAmount(
      convertUsdToCurrency(amountUsd, currency),
      currency,
      options
    );
  }

  function applyGlobalIncrease(amount) {
    const multiplier = 1 + getGlobalIncreasePercent() / 100;
    return roundMoney(toNumber(amount) * multiplier);
  }

  function deriveOriginalShippingInr(originalPriceUsd, originalPriceInr, originalShippingUsd) {
    if (!originalPriceUsd || !originalPriceInr || !originalShippingUsd) {
      return 0;
    }

    return roundMoney((originalPriceInr / originalPriceUsd) * originalShippingUsd);
  }

  function getRawPricing(item) {
    const originalPriceUsd = readValue(item, 'price_usd');
    const originalPriceInr = readValue(item, 'price_inr');
    const originalShippingUsd = readValue(item, 'shipping_usd', DEFAULT_SHIPPING_USD);
    const explicitShippingInr =
      item?.raw?.shipping_inr ??
      item?.shipping_inr ??
      item?.pricing?.original_shipping_inr;

    const originalShippingInr =
      explicitShippingInr !== undefined && explicitShippingInr !== null
        ? toNumber(explicitShippingInr)
        : deriveOriginalShippingInr(
          originalPriceUsd,
          originalPriceInr,
          originalShippingUsd
        );

    return {
      price_usd: roundMoney(originalPriceUsd),
      price_inr: roundMoney(originalPriceInr),
      shipping_usd: roundMoney(originalShippingUsd),
      shipping_inr: roundMoney(originalShippingInr)
    };
  }

  function calculateItemPricing(item, quantityOverride) {
    const raw = getRawPricing(item || {});
    const quantity = getQuantity(item || {}, quantityOverride);
    const selectedCurrency = getDisplayedCurrency();

    const finalPriceUsd = applyGlobalIncrease(raw.price_usd);
    const finalPriceInr = applyGlobalIncrease(raw.price_inr);
    const finalShippingUsd = applyGlobalIncrease(raw.shipping_usd);
    const finalShippingInr = applyGlobalIncrease(raw.shipping_inr);

    const finalMedicationTotalUsd = roundMoney(finalPriceUsd * quantity);
    const finalMedicationTotalInr = roundMoney(finalPriceInr * quantity);
    const finalTotalUsd = roundMoney(finalMedicationTotalUsd + finalShippingUsd);
    const finalTotalInr = roundMoney(finalMedicationTotalInr + finalShippingInr);

    return {
      original_price_usd: raw.price_usd,
      original_price_inr: raw.price_inr,

      final_price_usd: finalPriceUsd,
      final_price_inr: finalPriceInr,

      original_shipping_usd: raw.shipping_usd,
      original_shipping_inr: raw.shipping_inr,

      final_shipping_usd: finalShippingUsd,
      final_shipping_inr: finalShippingInr,

      final_total_usd: finalTotalUsd,
      final_total_inr: finalTotalInr,

      final_price_local: convertUsdToCurrency(finalPriceUsd, selectedCurrency),
      final_total_local: convertUsdToCurrency(finalTotalUsd, selectedCurrency),

      selected_currency: selectedCurrency,

      quantity,
      final_medication_total_usd: finalMedicationTotalUsd,
      final_medication_total_inr: finalMedicationTotalInr,
      final_medication_total_local: convertUsdToCurrency(finalMedicationTotalUsd, selectedCurrency),
      final_shipping_local: convertUsdToCurrency(finalShippingUsd, selectedCurrency)
    };
  }

  function normalizeCartItem(item, quantityOverride) {
    const raw = getRawPricing(item || {});
    const pricing = calculateItemPricing(item || {}, quantityOverride);

    return {
      ...(item || {}),
      quantity: pricing.quantity,
      raw,
      pricing,

      // Legacy compatibility: existing consumers can still read top-level final fields.
      final_price_usd: pricing.final_price_usd,
      final_price_inr: pricing.final_price_inr,
      final_shipping_usd: pricing.final_shipping_usd,
      final_shipping_inr: pricing.final_shipping_inr,
      final_total_usd: pricing.final_total_usd,
      final_total_inr: pricing.final_total_inr,
      final_price_local: pricing.final_price_local,
      final_total_local: pricing.final_total_local,
      selected_currency: pricing.selected_currency
    };
  }

  function calculateCartPricing(cartItems, options = {}) {
    const items = (cartItems || []).map((item) => normalizeCartItem(item));
    const selectedCurrency = getDisplayedCurrency();
    const taxUSD = roundMoney(options.taxUSD || 0);
    const taxINR = roundMoney(options.taxINR || 0);
    const discountRate = toNumber(options.discountRate, 0);

    const medicationTotalUSD = roundMoney(
      items.reduce((sum, item) => sum + item.pricing.final_medication_total_usd, 0)
    );
    const medicationTotalINR = roundMoney(
      items.reduce((sum, item) => sum + item.pricing.final_medication_total_inr, 0)
    );
    const shippingUSD = items.length ? items[0].pricing.final_shipping_usd : 0;
    const shippingINR = items.length ? items[0].pricing.final_shipping_inr : 0;
    const discountUSD = roundMoney(medicationTotalUSD * discountRate);
    const discountINR = roundMoney(medicationTotalINR * discountRate);
    const grandTotalUSD = roundMoney(medicationTotalUSD + shippingUSD + taxUSD - discountUSD);
    const grandTotalINR = roundMoney(medicationTotalINR + shippingINR + taxINR - discountINR);

    return {
      items,

      medicationTotalUSD,
      medicationTotalINR,

      shippingUSD,
      shippingINR,

      grandTotalUSD,
      grandTotalINR,

      medicationTotalLocal: convertUsdToCurrency(medicationTotalUSD, selectedCurrency),
      shippingLocal: convertUsdToCurrency(shippingUSD, selectedCurrency),
      grandTotalLocal: convertUsdToCurrency(grandTotalUSD, selectedCurrency),

      selected_currency: selectedCurrency,
      currency: selectedCurrency,
      taxUSD,
      taxINR,
      taxLocal: convertUsdToCurrency(taxUSD, selectedCurrency),
      discountUSD,
      discountINR,
      discountLocal: convertUsdToCurrency(discountUSD, selectedCurrency)
    };
  }

  return {
    DEFAULT_SHIPPING_USD,
    calculateItemPricing,
    calculateCartPricing,
    normalizeCartItem,
    getDisplayedCurrency,
    getGlobalIncreasePercent,
    convertUsdToCurrency,
    formatCurrencyAmount,
    formatLocalAmount
  };
});
