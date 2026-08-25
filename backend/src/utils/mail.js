import * as Brevo from '@getbrevo/brevo';

const brevo = new Brevo.BrevoClient({
  apiKey: process.env.BREVO_API_KEY,
});

const transporter = {
  async sendMail({ from, to, subject, text, html }) {
    try {
      const result = await brevo.transactionalEmails.sendTransacEmail({
        sender: {
          name:
            process.env.BREVO_SENDER_NAME ||
            process.env.EMAIL_SENDER_NAME ||
            'TaskCircle',

          email:
            process.env.BREVO_SENDER_EMAIL ||
            process.env.EMAIL_SENDER_EMAIL,
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
      console.error('[Brevo Error]:', error);
      throw error;
    }
  },
};

export default transporter;