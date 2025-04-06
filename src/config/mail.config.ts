import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';

const MailConfig = {
  transport: {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  },
  defaults: {
    from: '"No Reply" <no-reply@localhost>',
  },
  template: {
    dir: 'dist/utils/emailTemplates',
    adapter: new HandlebarsAdapter(),
    options: {
      strict: false,
    },
  },
};

export default MailConfig;
