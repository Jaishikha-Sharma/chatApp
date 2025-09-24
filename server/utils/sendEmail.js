import nodemailer from "nodemailer";

export const sendEmail = async (to, subject, content, isHtml = false) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT, 10),
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      [isHtml ? "html" : "text"]: content,
    });

    console.log("✅ Email sent successfully!");
    console.log("Message ID:", info.messageId);
    console.log("Envelope:", info.envelope);
  } catch (error) {
    console.log("❌ Error sending email:", error.message);
  }
};
