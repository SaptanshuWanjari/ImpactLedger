function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrapText(text: string, maxCharsPerLine: number) {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxCharsPerLine) {
      current = next;
      continue;
    }
    if (current) lines.push(current);
    current = word;
  }

  if (current) lines.push(current);
  return lines;
}

function textCommand(input: {
  x: number;
  y: number;
  size: number;
  text: string;
  color?: [number, number, number];
}) {
  const color = input.color || [0.08, 0.08, 0.08];
  return [
    `${color[0]} ${color[1]} ${color[2]} rg`,
    "BT",
    `/F1 ${input.size} Tf`,
    `${input.x} ${input.y} Td`,
    `(${escapePdfText(input.text)}) Tj`,
    "ET",
  ].join("\n");
}

function rectangleCommand(input: {
  x: number;
  y: number;
  width: number;
  height: number;
  fill: [number, number, number];
}) {
  return [
    `${input.fill[0]} ${input.fill[1]} ${input.fill[2]} rg`,
    `${input.x} ${input.y} ${input.width} ${input.height} re`,
    "f",
  ].join("\n");
}

function lineCommand(input: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke: [number, number, number];
  width?: number;
}) {
  return [
    `${input.stroke[0]} ${input.stroke[1]} ${input.stroke[2]} RG`,
    `${input.width || 1} w`,
    `${input.x1} ${input.y1} m`,
    `${input.x2} ${input.y2} l`,
    "S",
  ].join("\n");
}

function createPdfDocument(contentStream: string) {
  const objects: string[] = [];
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[2] = "<< /Type /Pages /Kids [3 0 R] /Count 1 >>";
  objects[3] = "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>";
  objects[4] = `<< /Length ${Buffer.byteLength(contentStream, "utf8")} >>\nstream\n${contentStream}endstream`;
  objects[5] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];

  for (let i = 1; i <= 5; i += 1) {
    offsets[i] = Buffer.byteLength(pdf, "utf8");
    pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`;
  }

  const xrefStart = Buffer.byteLength(pdf, "utf8");
  pdf += "xref\n";
  pdf += `0 ${objects.length}\n`;
  pdf += "0000000000 65535 f \n";

  for (let i = 1; i <= 5; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += "trailer\n";
  pdf += `<< /Size ${objects.length} /Root 1 0 R >>\n`;
  pdf += "startxref\n";
  pdf += `${xrefStart}\n`;
  pdf += "%%EOF\n";

  return Buffer.from(pdf, "utf8");
}

export function createDonationReceiptPdf(input: {
  donationId: string;
  donorName: string;
  donorEmail: string;
  campaignTitle: string;
  amountInInr: number;
  donatedAtIso: string;
  orgName: string;
  receiptUrl: string;
  paymentMethod?: string | null;
  paymentProvider?: string | null;
}) {
  const paidOn = new Date(input.donatedAtIso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
  });

  const amountLabel = `INR ${Number(input.amountInInr || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const commands: string[] = [];

  commands.push(rectangleCommand({ x: 0, y: 752, width: 595, height: 90, fill: [0.08, 0.08, 0.08] }));
  commands.push(rectangleCommand({ x: 0, y: 744, width: 595, height: 8, fill: [0.0, 0.2, 0.55] }));

  commands.push(textCommand({ x: 44, y: 806, size: 22, text: "Impact Ledger", color: [1, 1, 1] }));
  commands.push(textCommand({ x: 44, y: 786, size: 10, text: "Secure Stewardship Receipt", color: [0.86, 0.9, 0.96] }));
  commands.push(textCommand({ x: 44, y: 772, size: 9, text: "Lions NGO Management System", color: [0.72, 0.78, 0.86] }));

  commands.push(textCommand({ x: 400, y: 806, size: 11, text: "DONATION RECEIPT", color: [1, 1, 1] }));
  commands.push(textCommand({ x: 400, y: 790, size: 9, text: "Status: Succeeded", color: [0.8, 0.94, 0.82] }));
  commands.push(textCommand({ x: 400, y: 776, size: 9, text: `Payment Method: ${input.paymentMethod || "UPI"}`, color: [0.86, 0.9, 0.96] }));

  commands.push(textCommand({ x: 44, y: 720, size: 13, text: "Transaction Summary" }));
  commands.push(lineCommand({ x1: 44, y1: 714, x2: 551, y2: 714, stroke: [0.9, 0.9, 0.9] }));

  const leftRows = [
    ["Receipt ID", input.donationId],
    ["Donor Name", input.donorName || "Anonymous"],
    ["Donor Email", input.donorEmail],
    ["Campaign", input.campaignTitle || "General Impact Fund"],
  ] as const;

  let y = 688;
  for (const [label, value] of leftRows) {
    commands.push(textCommand({ x: 44, y, size: 9, text: label, color: [0.45, 0.45, 0.45] }));
    commands.push(textCommand({ x: 170, y, size: 11, text: value }));
    y -= 28;
  }

  const rightRows = [
    ["Amount", amountLabel],
    ["Currency", "INR"],
    ["Paid On (IST)", paidOn],
    ["Source", "Impact Ledger Web Checkout"],
  ] as const;

  y = 688;
  for (const [label, value] of rightRows) {
    commands.push(textCommand({ x: 340, y, size: 9, text: label, color: [0.45, 0.45, 0.45] }));
    commands.push(textCommand({ x: 440, y, size: 11, text: value }));
    y -= 28;
  }

  commands.push(lineCommand({ x1: 44, y1: 570, x2: 551, y2: 570, stroke: [0.9, 0.9, 0.9] }));
  commands.push(textCommand({ x: 44, y: 546, size: 12, text: "Verification Note" }));

  const providerName = input.paymentProvider === "gpay" ? "Google Pay QR" : "Razorpay UPI";
  const verificationParagraphs = [
    `This receipt confirms that your donation has been captured through ${providerName} and recorded in Impact Ledger.`,
    "All stewardship events are reconciled through API and webhook verification to maintain radical transparency.",
  ];

  let noteY = 522;
  for (const paragraph of verificationParagraphs) {
    const wrapped = wrapText(paragraph, 92);
    for (const line of wrapped) {
      commands.push(textCommand({ x: 44, y: noteY, size: 10, text: line, color: [0.2, 0.2, 0.2] }));
      noteY -= 16;
    }
    noteY -= 8;
  }

  commands.push(textCommand({ x: 44, y: 428, size: 10, text: "Receipt URL", color: [0.45, 0.45, 0.45] }));
  const receiptUrlLines = wrapText(input.receiptUrl, 88);
  let urlY = 410;
  for (const line of receiptUrlLines) {
    commands.push(textCommand({ x: 44, y: urlY, size: 10, text: line, color: [0.0, 0.2, 0.55] }));
    urlY -= 14;
  }

  commands.push(rectangleCommand({ x: 0, y: 0, width: 595, height: 70, fill: [0.97, 0.97, 0.97] }));
  commands.push(textCommand({ x: 44, y: 42, size: 9, text: `${input.orgName} • Fund the Mission`, color: [0.1, 0.1, 0.1] }));
  commands.push(textCommand({ x: 44, y: 26, size: 8, text: "Empowering modern humanitarian stewardship with radical transparency.", color: [0.4, 0.4, 0.4] }));
  commands.push(textCommand({ x: 415, y: 26, size: 8, text: `Generated: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`, color: [0.4, 0.4, 0.4] }));

  return createPdfDocument(`${commands.join("\n")}\n`);
}
