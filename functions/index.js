/* =========================================
VITAL ELIXIR GLOBALIST
AUTOMATIC MEDICATION REQUEST EMAIL SYSTEM
========================================= */

const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const logger = require("firebase-functions/logger");

const nodemailer = require("nodemailer");

/* =========================================
GMAIL TRANSPORT CONFIGURATION
========================================= */

const transporter = nodemailer.createTransport({

  service: "gmail",

  auth: {

    user: "vitalelixirglobalist@gmail.com",

    pass: "wzfuscvgvhfffixg"

  }

});

function readFinalPricing(item) {
  const pricing = item.pricing || {};

  return {
    finalPriceUSD:
      pricing.final_price_usd ??
      item.final_price_usd ??
      "N/A",

    finalPriceINR:
      pricing.final_price_inr ??
      item.final_price_inr ??
      "N/A",

    finalTotalUSD:
      pricing.final_total_usd ??
      item.final_total_usd ??
      "N/A",

    finalTotalINR:
      pricing.final_total_inr ??
      item.final_total_inr ??
      "N/A"
  };
}

function readPricingSummary(data) {
  return data.pricingSummary || data.totals || {};
}

/* =========================================
FIREBASE TRIGGER
RUNS AUTOMATICALLY WHEN NEW REQUEST ADDED
========================================= */

exports.sendMedicationRequestEmail = onDocumentCreated(

  "medication_requests/{requestId}",

  async (event) => {

    try {

      const data = event.data.data();

      const customer = data.customer || {};
      const items = data.items || [];
      const totals = readPricingSummary(data);

      let itemList = "";

      items.forEach((item, index) => {
        const pricing = readFinalPricing(item);

        itemList += `
${index + 1}. ${item.name || "Medicine"}

Pack: ${item.pack || "N/A"}

Quantity: ${item.quantity || 1}

Price:
USD ${pricing.finalPriceUSD}
INR ${pricing.finalPriceINR}

Item Total:
USD ${pricing.finalTotalUSD}
INR ${pricing.finalTotalINR}

-----------------------------------
`;

      });

      const mailOptions = {

        from: "Vital Elixir Globalist <vitalelixirglobalist@gmail.com>",

        to: "vitalelixirglobalist@gmail.com",

        subject:
`NEW MEDICATION REQUEST – ${customer.name || "Customer"} – ${customer.country || ""}`,

        text: `

NEW MEDICATION REQUEST RECEIVED

====================================

CUSTOMER DETAILS

Name:
${customer.name || "N/A"}

Email:
${customer.email || "N/A"}

Phone:
${customer.phone || "N/A"}

Country:
${customer.country || "N/A"}

Address:
${customer.address || "N/A"}

====================================

MEDICATIONS

${itemList}

====================================

TOTALS

USD:
${totals.grandTotalUSD || 0}

INR:
${totals.grandTotalINR || 0}

====================================

REQUEST STATUS:
${data.status || "new-request"}

REQUEST DATE:
${data.requestDate || ""}

====================================

Generated automatically from
Vital Elixir Globalist website.

`

      };

      await transporter.sendMail(mailOptions);

      logger.info("Medication request email sent successfully.");

    } catch (error) {

      logger.error("Email sending failed:", error);

    }

  }

);
