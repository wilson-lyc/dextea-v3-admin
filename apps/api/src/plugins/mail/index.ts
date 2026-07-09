import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import nodemailer from 'nodemailer';
import type { SendMailOptions, Transporter } from 'nodemailer';
import { config } from '../config/index.js';

declare module 'fastify' {
  interface FastifyInstance {
    mailService: MailService;
  }
}

export interface MailService {
  sendMail(options: SendMailOptions): Promise<void>;
}

const mailPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  const { host, port, secure, user, pass, from } = config.mail;

  if (!host || !user || !pass) {
    fastify.log.warn(
      'Mail service is not configured. Set MAIL_HOST, MAIL_USER, and MAIL_PASS env vars to enable email sending.'
    );
    fastify.decorate('mailService', {
      async sendMail(_options: SendMailOptions) {
        fastify.log.warn('Mail service not configured — skipping email send.');
      },
    } satisfies MailService);
    return;
  }

  const transporter: Transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  // Verify connection configuration on startup
  try {
    await transporter.verify();
    fastify.log.info('Mail service connected successfully');
  } catch (err) {
    fastify.log.warn({ err }, 'Mail service verification failed — will retry on send.');
  }

  const mailService: MailService = {
    async sendMail(options: SendMailOptions) {
      await transporter.sendMail({
        from: from || user,
        ...options,
      });
    },
  };

  fastify.decorate('mailService', mailService);
};

export default fp(mailPlugin, {
  name: 'mail',
});
