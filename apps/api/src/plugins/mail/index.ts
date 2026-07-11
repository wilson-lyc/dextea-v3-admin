import nodemailer from 'nodemailer';
import type { SendMailOptions, Transporter } from 'nodemailer';
import { config } from '@/config/index.js';

export interface MailService {
  sendMail(options: SendMailOptions): Promise<void>;
}

const { host, port, secure, user, pass, from } = config.mail;

let transporter: Transporter | null = null;

if (!host || !user || !pass) {
  console.warn(
    '[mail] Mail service is not configured. Set MAIL_HOST, MAIL_USER, and MAIL_PASS env vars to enable email sending.',
  );
} else {
  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  // 异步验证（不阻塞启动）
  transporter.verify().then(() => {
    console.log('[mail] Mail service connected successfully');
  }).catch((err) => {
    console.warn('[mail] Mail service verification failed — will retry on send.', err);
  });
}

export const mailService: MailService = {
  async sendMail(options: SendMailOptions) {
    if (!transporter) {
      console.warn('[mail] Mail service not configured — skipping email send.');
      return;
    }

    await transporter.sendMail({
      from: from || user!,
      ...options,
    });
  },
};
