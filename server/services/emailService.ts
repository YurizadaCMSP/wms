import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL || '',
    pass: process.env.SMTP_PASSWORD || '',
  },
});

const getEmailTemplate = (title: string, content: string): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Inter', Arial, sans-serif; background: #F8F9FA; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #D4A843, #B8922F); padding: 30px; text-align: center; }
    .header h1 { color: #FFFFFF; margin: 0; font-size: 22px; }
    .header p { color: #F5E6C3; margin: 8px 0 0; font-size: 13px; }
    .body { padding: 30px; }
    .body h2 { color: #2D2D3A; font-size: 18px; margin-top: 0; }
    .body p { color: #6B7280; line-height: 1.6; font-size: 14px; }
    .highlight { background: #F5E6C3; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #D4A843; }
    .highlight strong { color: #2D2D3A; }
    .button { display: inline-block; background: #D4A843; color: #FFFFFF; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 15px 0; }
    .footer { background: #1E1E2D; padding: 20px; text-align: center; }
    .footer p { color: #9CA3AF; margin: 0; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Secretaria WMS</h1>
      <p>Sistema Oficial de Controle de Estoque | EJC Cocaia 2026</p>
    </div>
    <div class="body">
      <h2>${title}</h2>
      ${content}
    </div>
    <div class="footer">
      <p>Equipe Secretaria | Encontro de Jovens com Cristo - EJC Cocaia 2026</p>
      <p>Este e-mail foi enviado automaticamente pelo sistema.</p>
    </div>
  </div>
</body>
</html>
  `;
};

export const sendNewAccountEmail = async (to: string, name: string, email: string, password: string): Promise<void> => {
  const content = `
    <p>Olá, <strong>${name}</strong>!</p>
    <p>Sua conta foi criada no <strong>Secretaria WMS</strong>. Abaixo estão seus dados de acesso:</p>
    <div class="highlight">
      <strong>E-mail:</strong> ${email}<br>
      <strong>Senha:</strong> ${password}
    </div>
    <p>Acesse o sistema e altere sua senha após o primeiro login para maior segurança.</p>
    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="button">Acessar o Sistema</a>
  `;

  await transporter.sendMail({
    from: `"Secretaria WMS" <${process.env.SMTP_EMAIL}>`,
    to,
    subject: 'Sua conta foi criada - Secretaria WMS',
    html: getEmailTemplate('Bem-vindo ao Secretaria WMS!', content),
  });
};

export const sendPasswordResetEmail = async (to: string, name: string, resetToken: string): Promise<void> => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
  const content = `
    <p>Olá, <strong>${name}</strong>!</p>
    <p>Recebemos uma solicitação para redefinir sua senha no <strong>Secretaria WMS</strong>.</p>
    <p>Clique no botão abaixo para criar uma nova senha. Este link expira em 1 hora.</p>
    <a href="${resetUrl}" class="button">Redefinir Senha</a>
    <p style="margin-top: 20px; font-size: 12px; color: #9CA3AF;">Se você não solicitou esta alteração, ignore este e-mail.</p>
  `;

  await transporter.sendMail({
    from: `"Secretaria WMS" <${process.env.SMTP_EMAIL}>`,
    to,
    subject: 'Recuperação de Senha - Secretaria WMS',
    html: getEmailTemplate('Recuperação de Senha', content),
  });
};

export const sendNewPasswordEmail = async (to: string, name: string, newPassword: string): Promise<void> => {
  const content = `
    <p>Olá, <strong>${name}</strong>!</p>
    <p>Sua senha foi redefinida no <strong>Secretaria WMS</strong>.</p>
    <div class="highlight">
      <strong>Nova senha:</strong> ${newPassword}
    </div>
    <p>Acesse o sistema e altere sua senha após o login para maior segurança.</p>
    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="button">Acessar o Sistema</a>
  `;

  await transporter.sendMail({
    from: `"Secretaria WMS" <${process.env.SMTP_EMAIL}>`,
    to,
    subject: 'Nova Senha - Secretaria WMS',
    html: getEmailTemplate('Sua Senha Foi Redefinida', content),
  });
};

export const testSMTPConnection = async (): Promise<boolean> => {
  try {
    await transporter.verify();
    return true;
  } catch {
    return false;
  }
};
