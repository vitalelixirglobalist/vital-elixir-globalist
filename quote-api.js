/*
 * ============================================================
 * VITAL ELIXIR — PRIVATE QUOTE API CLIENT
 * Phase C.1
 * ============================================================
 *
 * Browser-side communication layer for the private
 * Google Apps Script pricing service.
 *
 * IMPORTANT:
 * - Contains NO medication acquisition costs.
 * - Contains NO profit formula.
 * - Contains NO signing secret.
 * - Browser prices are NEVER sent as trusted inputs.
 *
 * Server pricing identity:
 *
 *      managerKey + selected variant quantity
 *
 * Example:
 *
 *      P0001 + 50
 *
 * ============================================================
 */

(function () {

  'use strict';


  const QUOTE_API_URL =
    'https://script.google.com/macros/s/AKfycbxwQLgjl8tqWHT06pil8LvSrmhJiGKiQ8IrRhy6RLljltgFtMV3TmSuZZ00QIdV3htq/exec';


  /*
   * ----------------------------------------------------------
   * NORMALIZE ONE CART ITEM INTO A SERVER SELECTION
   * ----------------------------------------------------------
   *
   * Cart:
   *
   * {
   *   managerKey: "P0001",
   *   selectedQuantity: 50
   * }
   *
   * becomes:
   *
   * {
   *   managerKey: "P0001",
   *   quantity: 50
   * }
   *
   * No browser price is sent.
   * ----------------------------------------------------------
   */

  function cartItemToSelection(item) {

    if (
      !item ||
      typeof item !== 'object'
    ) {
      throw new Error(
        'Invalid cart item.'
      );
    }


    const managerKey =
      String(
        item.managerKey || ''
      ).trim();


    const quantity =
      Number(
        item.selectedQuantity
      );


    if (
      !/^P\d{4,}$/.test(
        managerKey
      )
    ) {
      throw new Error(
        'Cart item is missing a valid Manager Key.'
      );
    }


    if (
      !Number.isInteger(quantity) ||
      quantity <= 0 ||
      quantity > 500
    ) {
      throw new Error(
        'Cart item has an invalid selected quantity.'
      );
    }


    return {

      managerKey:
        managerKey,

      quantity:
        quantity

    };

  }


  /*
   * Convert the complete cart into the only information
   * the private pricing server needs.
   */

  function cartToSelections(cart) {

    if (
      !Array.isArray(cart) ||
      cart.length === 0
    ) {
      throw new Error(
        'Cannot quote an empty cart.'
      );
    }


    return cart.map(
      cartItemToSelection
    );

  }


  /*
   * ----------------------------------------------------------
   * LOW-LEVEL API REQUEST
   * ----------------------------------------------------------
   */

  async function postToQuoteApi(payload) {

    const response =
      await fetch(
        QUOTE_API_URL,
        {
          method:
            'POST',

          /*
           * text/plain deliberately avoids unnecessary
           * browser preflight behavior and is accepted by
           * our hardened Apps Script boundary.
           */
          headers: {
            'Content-Type':
              'text/plain;charset=utf-8'
          },

          body:
            JSON.stringify(
              payload
            )
        }
      );


    if (!response.ok) {

      throw new Error(
        'Quote service returned HTTP ' +
        response.status +
        '.'
      );

    }


    let data;


    try {

      data =
        await response.json();

    } catch (error) {

      throw new Error(
        'Quote service returned an invalid response.'
      );

    }


    return data;

  }


  /*
   * ----------------------------------------------------------
   * REQUEST A NEW SIGNED QUOTE
   * ----------------------------------------------------------
   */

  async function requestQuote(cart) {

    const selections =
      cartToSelections(
        cart
      );


    const result =
      await postToQuoteApi({

        action:
          'quote',

        selections:
          selections

      });


    if (
      !result ||
      result.ok !== true ||
      !result.quote
    ) {

      const message =
        result &&
        result.error &&
        result.error.message
          ? result.error.message
          : 'Unable to calculate quotation.';


      throw new Error(
        message
      );

    }


    if (
      !result.quote.quoteId ||
      !result.quote.signature
    ) {

      throw new Error(
        'Quote service returned an incomplete signed quotation.'
      );

    }


    return result.quote;

  }


  /*
   * ----------------------------------------------------------
   * VERIFY AN EXISTING SIGNED QUOTE
   * ----------------------------------------------------------
   *
   * Used immediately before the customer enquiry/request
   * is accepted by the website.
   *
   * This is NOT payment verification.
   * ----------------------------------------------------------
   */

  async function verifyCheckoutQuote(
    signedQuote
  ) {

    if (
      !signedQuote ||
      typeof signedQuote !== 'object'
    ) {
      throw new Error(
        'Missing checkout quotation.'
      );
    }


    const result =
      await postToQuoteApi({

        action:
          'verifyCheckout',

        quote:
          signedQuote

      });


    if (
      !result ||
      result.ok !== true ||
      result.verified !== true ||
      !result.quote
    ) {

      const code =
        result &&
        result.error &&
        result.error.code
          ? result.error.code
          : 'CHECKOUT_UNAVAILABLE';


      const message =
        result &&
        result.error &&
        result.error.message
          ? result.error.message
          : 'Unable to verify checkout quotation.';


      const error =
        new Error(
          message
        );


      error.code =
        code;


      throw error;

    }


    return result.quote;

  }


  /*
   * ----------------------------------------------------------
   * SAFE PUBLIC BROWSER INTERFACE
   * ----------------------------------------------------------
   */

  window.vitalQuoteApi = {

    requestQuote:
      requestQuote,

    verifyCheckoutQuote:
      verifyCheckoutQuote,

    cartToSelections:
      cartToSelections,

    cartItemToSelection:
      cartItemToSelection

  };


})();