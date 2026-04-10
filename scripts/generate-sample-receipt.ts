import fs from "fs";
import path from "path";
import { createDonationReceiptPdf } from "../src/lib/server/pdf";

async function generateSampleReceipt() {
  const pdfBuffer = createDonationReceiptPdf({
    donationId: "IL-DON-" + Math.floor(Math.random() * 1000000),
    donorName: "Saptanshu",
    donorEmail: "saptanshu@example.com",
    campaignTitle: "General Impact Fund",
    amountInInr: 2000,
    donatedAtIso: new Date().toISOString(),
    orgName: "Impact Ledger",
    receiptUrl: "https://impactledger.app/receipts/sample-receipt",
    paymentMethod: "Google Pay QR (Manual)",
    paymentProvider: "gpay",
  });

  const outputPath = path.join(process.cwd(), "sample-gpay-receipt.pdf");
  fs.writeFileSync(outputPath, pdfBuffer);

  console.log(`✅ Sample GPay receipt successfully generated at: ${outputPath}`);
}

generateSampleReceipt().catch((error) => {
  console.error("❌ Failed to generate sample receipt:", error);
  process.exit(1);
});
