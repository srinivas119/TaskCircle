import { BrevoClient, BrevoError } from '@getbrevo/brevo';

const brevo = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY,
});

const transporter = {
  async sendMail({ from, to, subject, text, html }) {
    try {
      const result = await brevo.transactionalEmails.sendTransacEmail({
        sender: {
          name: process.env.BREVO_SENDER_NAME || process.env.EMAIL_SENDER_NAME || 'TaskCircle',
          // Fallback to standard environment variable names if BREVO_SENDER_EMAIL isn't set
          email: process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_SENDER_EMAIL,
        },
        to: [
          {
            email: to,
          },
        ],
        subject,
        textContent: text,
        htmlContent: html,
      });

      return result;
    } catch (error) {
      if (error instanceof BrevoError) {
        console.error(`[Brevo Error] Status ${error.statusCode}:`, error.message);
        if (error.body) {
          console.error('[Brevo Error Details]:', JSON.stringify(error.body));
        }
      } else {
        console.error('[Mail Error]:', error.message);
      }
      throw error;
    }
  },
};

export default transporter;