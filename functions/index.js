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
      const totals = data.totals || {};

      let itemList = "";

      items.forEach((item, index) => {

        itemList += `
${index + 1}. ${item.name || "Medicine"}

Pack: ${item.pack || "N/A"}

Quantity: ${item.quantity || 1}

Price:
USD ${item.price_usd || 0}
INR ${item.price_inr || 0}

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
${totals.totalUSD || 0}

INR:
${totals.totalINR || 0}

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