import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

console.log('Testing SMTP connection...');
transporter.verify()
  .then(() => {
    console.log('SMTP configuration is correct. Sending test email...');
    return transporter.sendMail({
      from: process.env.SMTP_USER,
      to: 'klanphs.solutions@gmail.com',
      subject: 'Test Email from Klanvision',
      text: 'This is a test email to verify mail functionality.'
    });
  })
  .then(() => console.log('Test email sent successfully!'))
  .catch(error => {
    console.error('Email error:', error.message);
  });
