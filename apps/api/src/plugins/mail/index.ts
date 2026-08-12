import nodemailer from 'nodemailer';
import type { SendMailOptions, Transporter } from 'nodemailer';

export interface MailService {
  sendMail(options: SendMailOptions): Promise<void>;
}

const host = process.env.MAIL_HOST || '';
const port = Number(process.env.MAIL_PORT) || 587;
const secure = process.env.MAIL_SECURE === 'true';
const user = process.env.MAIL_USER || '';
const pass = process.env.MAIL_PASS || '';
const from = process.env.MAIL_FROM || '';

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
