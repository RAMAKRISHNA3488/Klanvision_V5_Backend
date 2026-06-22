import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode-svg';

/**
 * Generates and draws a QR Code on a page.
 */
function drawQRCode(page, text, qrX, qrY, targetSize) {
  const qr = new QRCode({
    content: text,
    width: 256,
    height: 256,
    padding: 0,
    background: '#ffffff',
    color: '#000000',
    ecl: 'M'
  });
  const svg = qr.svg();
  
  // Match all black rect elements in the SVG
  const rectRegex = /<rect\s+x="([\d.]+)"\s+y="([\d.]+)"\s+width="([\d.]+)"\s+height="([\d.]+)"[^>]+style="fill:#000000/g;
  const matches = [...svg.matchAll(rectRegex)];
  
  const scale = targetSize / 256;
  
  for (const match of matches) {
    const rx = qrX + parseFloat(match[1]) * scale;
    // Invert Y coordinate since PDF starts at bottom-left and SVG starts at top-left
    const ry = qrY + (256 - parseFloat(match[2]) - parseFloat(match[4])) * scale;
    const rw = parseFloat(match[3]) * scale;
    const rh = parseFloat(match[4]) * scale;
    
    page.drawRectangle({
      x: rx,
      y: ry,
      width: rw,
      height: rh,
      color: rgb(0, 0, 0)
    });
  }
}

/**
 * Generates an Offer Letter PDF.
 */
export async function generateOfferLetter(data) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.27, 841.89]); // A4 Size
  const { width, height } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontTimes = await pdfDoc.embedFont(StandardFonts.TimesRoman);

  // Borders
  page.drawRectangle({
    x: 20,
    y: 20,
    width: width - 40,
    height: height - 40,
    borderColor: rgb(0.09, 0.13, 0.22),
    borderWidth: 2,
    color: rgb(1, 1, 1, 0)
  });
  
  page.drawRectangle({
    x: 24,
    y: 24,
    width: width - 48,
    height: height - 48,
    borderColor: rgb(0.85, 0.65, 0.13), // Gold border
    borderWidth: 1,
    color: rgb(1, 1, 1, 0)
  });

  // Header Logo / Text
  page.drawText('KLANVISION IT SOLUTIONS', {
    x: 50,
    y: height - 80,
    size: 24,
    font: fontBold,
    color: rgb(0.09, 0.13, 0.22)
  });

  page.drawText('Professional & Expert Engineering Solutions', {
    x: 50,
    y: height - 95,
    size: 10,
    font: fontRegular,
    color: rgb(0.5, 0.5, 0.5)
  });

  page.drawLine({
    start: { x: 50, y: height - 105 },
    end: { x: width - 50, y: height - 105 },
    thickness: 1.5,
    color: rgb(0.85, 0.65, 0.13)
  });

  // Letter details
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  page.drawText(`Date: ${today}`, { x: 50, y: height - 140, size: 11, font: fontRegular });
  page.drawText(`Candidate ID: ${data.candidateId}`, { x: 50, y: height - 160, size: 11, font: fontBold });

  page.drawText('LETTER OF INTERNSHIP OFFER', {
    x: width / 2 - 100,
    y: height - 210,
    size: 16,
    font: fontBold,
    color: rgb(0.09, 0.13, 0.22)
  });

  const bodyText = [
    `Dear ${data.name},`,
    '',
    `Following your application and subsequent interview, we are pleased to offer you an internship opportunity at Klanvision IT Solutions as a ${data.role} in our ${data.domain} department.`,
    '',
    `Your internship is scheduled to run for a duration of ${data.duration}, starting on ${data.startDate} and concluding on ${data.endDate}. During this period, you will work under the mentorship of ${data.mentorName || 'a Senior Project Manager'}.`,
    '',
    'During this internship, you will be exposed to enterprise-level software design patterns, CI/CD operations, and professional code engineering practices. You are expected to adhere to our corporate code of conduct, intellectual property protection, and security guidelines.',
    '',
    'We look forward to a mutually beneficial association and are confident that this internship will provide you with valuable industry insights and practical experience.',
    '',
    'Sincerely,',
    'Klanvision IT Solutions HR Team'
  ];

  let currentY = height - 250;
  for (const line of bodyText) {
    if (line === '') {
      currentY -= 12;
      continue;
    }
    // Simple text wrapping for standard A4 margins
    const words = line.split(' ');
    let currentLine = '';
    for (const word of words) {
      const testLine = currentLine + word + ' ';
      const widthOfTest = fontRegular.widthOfTextAtSize(testLine, 11);
      if (widthOfTest > width - 100) {
        page.drawText(currentLine.trim(), { x: 50, y: currentY, size: 11, font: fontRegular });
        currentY -= 18;
        currentLine = word + ' ';
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      page.drawText(currentLine.trim(), { x: 50, y: currentY, size: 11, font: fontRegular });
      currentY -= 18;
    }
  }

  // Signature Block
  page.drawText('Authorized Signature', { x: 50, y: 150, size: 11, font: fontBold });
  page.drawText('Kiran Kumar Moopuri', { x: 50, y: 110, size: 12, font: fontTimes, color: rgb(0.2, 0.3, 0.6) }); // Simulated signature
  page.drawText('Director of Engineering, Klanvision', { x: 50, y: 95, size: 9, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });

  return await pdfDoc.save();
}

/**
 * Generates an Internship Participation Letter PDF.
 */
export async function generateParticipationLetter(data) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.27, 841.89]);
  const { width, height } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontTimes = await pdfDoc.embedFont(StandardFonts.TimesRoman);

  // Borders
  page.drawRectangle({
    x: 20, y: 20, width: width - 40, height: height - 40,
    borderColor: rgb(0.09, 0.13, 0.22), borderWidth: 2, color: rgb(1, 1, 1, 0)
  });
  page.drawRectangle({
    x: 24, y: 24, width: width - 48, height: height - 48,
    borderColor: rgb(0.85, 0.65, 0.13), borderWidth: 1, color: rgb(1, 1, 1, 0)
  });

  // Header
  page.drawText('KLANVISION IT SOLUTIONS', { x: 50, y: height - 80, size: 24, font: fontBold, color: rgb(0.09, 0.13, 0.22) });
  page.drawText('Professional & Expert Engineering Solutions', { x: 50, y: height - 95, size: 10, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });
  page.drawLine({ start: { x: 50, y: height - 105 }, end: { x: width - 50, y: height - 105 }, thickness: 1.5, color: rgb(0.85, 0.65, 0.13) });

  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  page.drawText(`Date: ${today}`, { x: 50, y: height - 140, size: 11, font: fontRegular });
  page.drawText(`Candidate ID: ${data.candidateId}`, { x: 50, y: height - 160, size: 11, font: fontBold });

  page.drawText('TO WHOMSOEVER IT MAY CONCERN', {
    x: width / 2 - 120, y: height - 210, size: 14, font: fontBold, color: rgb(0.09, 0.13, 0.22)
  });

  const bodyText = [
    `This is to certify that ${data.name} is a registered participant in the Internship Program at Klanvision IT Solutions.`,
    '',
    `Internship Domain: ${data.domain}`,
    `Program Commencement Date: ${data.startDate}`,
    `Projected Duration: ${data.duration}`,
    `Assigned Supervisor/Mentor: ${data.mentorName || 'Klanvision Engineering Lead'}`,
    '',
    'This letter confirms joining and participation. The participant is currently engaged in design sprints, coding workflows, and stand-ups associated with their domain.',
    '',
    'We expect high discipline, standard engineering deliverables, and active collaboration from the intern throughout this duration.',
    '',
    'Should you require any further validation regarding their participation, please feel free to reach out to our office.',
    '',
    'Sincerely,',
    'Klanvision IT Solutions HR Team'
  ];

  let currentY = height - 250;
  for (const line of bodyText) {
    if (line === '') {
      currentY -= 12;
      continue;
    }
    const words = line.split(' ');
    let currentLine = '';
    for (const word of words) {
      const testLine = currentLine + word + ' ';
      const widthOfTest = fontRegular.widthOfTextAtSize(testLine, 11);
      if (widthOfTest > width - 100) {
        page.drawText(currentLine.trim(), { x: 50, y: currentY, size: 11, font: fontRegular });
        currentY -= 18;
        currentLine = word + ' ';
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      page.drawText(currentLine.trim(), { x: 50, y: currentY, size: 11, font: fontRegular });
      currentY -= 18;
    }
  }

  // Signature Block
  page.drawText('Authorized Signature', { x: 50, y: 150, size: 11, font: fontBold });
  page.drawText('Kiran Kumar Moopuri', { x: 50, y: 110, size: 12, font: fontTimes, color: rgb(0.2, 0.3, 0.6) });
  page.drawText('Director of Engineering, Klanvision', { x: 50, y: 95, size: 9, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });

  return await pdfDoc.save();
}

/**
 * Generates an Internship Completion Certificate PDF.
 */
export async function generateCompletionCertificate(data, verificationBaseUrl) {
  const pdfDoc = await PDFDocument.create();
  // Landscape A4 orientation: width = 841.89, height = 595.27
  const page = pdfDoc.addPage([841.89, 595.27]);
  const { width, height } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontTimesItalic = await pdfDoc.embedFont(StandardFonts.TimesItalic);
  const fontTimesBold = await pdfDoc.embedFont(StandardFonts.TimesBold);
  const fontTimes = await pdfDoc.embedFont(StandardFonts.TimesRoman);

  // Background shading/borders
  page.drawRectangle({
    x: 0, y: 0, width: width, height: height,
    color: rgb(0.98, 0.98, 0.99)
  });

  // Multi-layered elegant borders
  page.drawRectangle({
    x: 30, y: 30, width: width - 60, height: height - 60,
    borderColor: rgb(0.09, 0.13, 0.22), borderWidth: 3, color: rgb(1, 1, 1, 0)
  });

  page.drawRectangle({
    x: 36, y: 36, width: width - 72, height: height - 72,
    borderColor: rgb(0.85, 0.65, 0.13), borderWidth: 1.5, color: rgb(1, 1, 1, 0)
  });

  // Top header text
  page.drawText('KLANVISION IT SOLUTIONS', {
    x: width / 2 - 130, y: height - 85, size: 20, font: fontBold, color: rgb(0.09, 0.13, 0.22)
  });

  page.drawText('CERTIFICATE OF INTERNSHIP COMPLETION', {
    x: width / 2 - 200, y: height - 125, size: 18, font: fontTimesBold, color: rgb(0.85, 0.65, 0.13)
  });

  page.drawText('This certificate is proudly presented to', {
    x: width / 2 - 110, y: height - 170, size: 12, font: fontTimesItalic, color: rgb(0.4, 0.4, 0.4)
  });

  // Candidate Name
  const nameWidth = fontTimesBold.widthOfTextAtSize(data.name, 28);
  page.drawText(data.name, {
    x: width / 2 - nameWidth / 2, y: height - 215, size: 28, font: fontTimesBold, color: rgb(0.09, 0.13, 0.22)
  });

  // Underline Candidate Name
  page.drawLine({
    start: { x: width / 2 - 150, y: height - 225 },
    end: { x: width / 2 + 150, y: height - 225 },
    thickness: 1,
    color: rgb(0.85, 0.65, 0.13)
  });

  const descText = `For successfully completing their professional internship in the domain of ${data.domain} at Klanvision IT Solutions. During this internship, they served as a ${data.role || 'Software Intern'} under the supervisor mentorship programs.`;
  const descWords = descText.split(' ');
  let line1 = '', line2 = '';
  for (const w of descWords) {
    if (fontTimes.widthOfTextAtSize(line1 + w + ' ', 13) < width - 200) {
      line1 += w + ' ';
    } else {
      line2 += w + ' ';
    }
  }

  page.drawText(line1.trim(), { x: width / 2 - fontTimes.widthOfTextAtSize(line1.trim(), 13) / 2, y: height - 265, size: 13, font: fontTimes, color: rgb(0.3, 0.3, 0.3) });
  if (line2) {
    page.drawText(line2.trim(), { x: width / 2 - fontTimes.widthOfTextAtSize(line2.trim(), 13) / 2, y: height - 285, size: 13, font: fontTimes, color: rgb(0.3, 0.3, 0.3) });
  }

  // Internship Details
  const detailsY = height - 340;
  page.drawText(`Internship Duration: ${data.duration}`, { x: 100, y: detailsY, size: 11, font: fontRegular });
  page.drawText(`Date of Completion: ${data.certificateDate || new Date().toLocaleDateString()}`, { x: 100, y: detailsY - 20, size: 11, font: fontRegular });
  page.drawText(`Candidate ID: ${data.candidateId}`, { x: 100, y: detailsY - 40, size: 11, font: fontRegular });
  page.drawText(`Certificate Number: ${data.certificateNumber}`, { x: 100, y: detailsY - 60, size: 11, font: fontBold });

  // Verification Badge & Text
  page.drawText('Certificate Verified  [V]', { x: width / 2 - 60, y: 70, size: 10, font: fontBold, color: rgb(0.06, 0.6, 0.3) });

  // Digital Signature
  const sigX = width - 240;
  page.drawText('Kiran Kumar Moopuri', { x: sigX, y: detailsY - 10, size: 16, font: fontTimesItalic, color: rgb(0.2, 0.3, 0.6) });
  page.drawLine({ start: { x: sigX - 10, y: detailsY - 20 }, end: { x: sigX + 160, y: detailsY - 20 }, thickness: 1, color: rgb(0.6, 0.6, 0.6) });
  page.drawText('Director of Engineering, Klanvision', { x: sigX - 5, y: detailsY - 35, size: 9, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });

  // Embed Verification QR Code
  const qrUrl = `${verificationBaseUrl.replace(/\/$/, '')}/verify/${data.certificateNumber}`;
  drawQRCode(page, qrUrl, width - 150, 90, 80);

  page.drawText('Scan to Verify Authenticity', {
    x: width - 158,
    y: 75,
    size: 7,
    font: fontRegular,
    color: rgb(0.5, 0.5, 0.5)
  });

  return await pdfDoc.save();
}

/**
 * Generates a Recommendation Letter PDF.
 */
export async function generateRecommendationLetter(data) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.27, 841.89]);
  const { width, height } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontTimes = await pdfDoc.embedFont(StandardFonts.TimesRoman);

  // Borders
  page.drawRectangle({
    x: 20, y: 20, width: width - 40, height: height - 40,
    borderColor: rgb(0.09, 0.13, 0.22), borderWidth: 2, color: rgb(1, 1, 1, 0)
  });
  page.drawRectangle({
    x: 24, y: 24, width: width - 48, height: height - 48,
    borderColor: rgb(0.85, 0.65, 0.13), borderWidth: 1, color: rgb(1, 1, 1, 0)
  });

  // Header
  page.drawText('KLANVISION IT SOLUTIONS', { x: 50, y: height - 80, size: 24, font: fontBold, color: rgb(0.09, 0.13, 0.22) });
  page.drawText('Professional & Expert Engineering Solutions', { x: 50, y: height - 95, size: 10, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });
  page.drawLine({ start: { x: 50, y: height - 105 }, end: { x: width - 50, y: height - 105 }, thickness: 1.5, color: rgb(0.85, 0.65, 0.13) });

  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  page.drawText(`Date: ${today}`, { x: 50, y: height - 140, size: 11, font: fontRegular });
  page.drawText(`Certificate ID: ${data.candidateId}`, { x: 50, y: height - 160, size: 11, font: fontBold });

  page.drawText('LETTER OF RECOMMENDATION', {
    x: width / 2 - 110, y: height - 210, size: 14, font: fontBold, color: rgb(0.09, 0.13, 0.22)
  });

  const bodyText = [
    'TO WHOMSOEVER IT MAY CONCERN',
    '',
    `I am writing to highly recommend ${data.name} for any future professional endeavors in the technology field. They completed a professional internship program as a ${data.role} in our ${data.domain} department at Klanvision IT Solutions.`,
    '',
    `During the internship period of ${data.duration}, ${data.name} worked under our engineering mentors and successfully contributed to development deliverables.`,
    '',
    data.performanceRemarks ? `Mentor Remarks: "${data.performanceRemarks}"` : 'During this time, we observed them to be extremely self-motivated, technically competent, and quick to acquire complex engineering methodologies.',
    '',
    'They demonstrated strong analytical capabilities and a robust understanding of software development principles. They also worked exceptionally well within agile team environments, collaborating with other senior developers and engineers.',
    '',
    'We are confident that their skills, work ethic, and dedication will make them an invaluable asset to any engineering organization. We wish them the absolute best in their future career paths.',
    '',
    'Sincerely,',
    'Kiran Kumar Moopuri',
    'Director of Engineering, Klanvision IT Solutions'
  ];

  let currentY = height - 250;
  for (const line of bodyText) {
    if (line === '') {
      currentY -= 12;
      continue;
    }
    const words = line.split(' ');
    let currentLine = '';
    for (const word of words) {
      const testLine = currentLine + word + ' ';
      const widthOfTest = fontRegular.widthOfTextAtSize(testLine, 11);
      if (widthOfTest > width - 100) {
        page.drawText(currentLine.trim(), { x: 50, y: currentY, size: 11, font: fontRegular });
        currentY -= 18;
        currentLine = word + ' ';
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      page.drawText(currentLine.trim(), { x: 50, y: currentY, size: 11, font: fontRegular });
      currentY -= 18;
    }
  }

  // Signature Block
  page.drawLine({ start: { x: 50, y: 130 }, end: { x: 210, y: 130 }, thickness: 1, color: rgb(0.6, 0.6, 0.6) });
  page.drawText('Kiran Kumar Moopuri (Digital Signature)', { x: 50, y: 110, size: 11, font: fontTimes, color: rgb(0.2, 0.3, 0.6) });
  page.drawText('Director of Engineering, Klanvision', { x: 50, y: 95, size: 9, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });

  return await pdfDoc.save();
}
