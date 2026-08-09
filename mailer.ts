// Envio de e-mail transacional.
//
// Segue o mesmo padrão dos outros módulos de integração (mercadopago.ts,
// woovi.ts, smm.ts): tudo vem das configurações do painel, nada de variáveis de
// ambiente, uma função isXConfigured para o chamador decidir se pode usar, e
// erro lançado com mensagem em português.
//
// Dois provedores, escolhidos em Integrações → Envio de E-mail:
//
//   resend — REST puro (fetch), sem dependência;
//   smtp   — nodemailer, para quem já tem uma caixa de e-mail própria.
//
// O remetente é o mesmo nos dois: "Nome do Remetente <E-mail do Remetente>".

import nodemailer from 'nodemailer';
import dns from 'node:dns/promises';
import net from 'node:net';

export interface MailerConfig {
  emailProvider?: 'smtp' | 'resend' | string;
  resendApiKey?: string;
  smtpHost?: string;
  smtpPort?: string;
  smtpUser?: string;
  smtpPassword?: string;
  smtpFromName?: string;
  smtpFromEmail?: string;
  smtpSecure?: boolean;
}

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  /** Alternativa em texto puro. Gerada do HTML quando não informada. */
  text?: string;
}

const isEmail = (v?: string) => !!v && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

/**
 * Diz se dá para enviar e-mail com o que está configurado.
 *
 * O remetente é obrigatório nos dois provedores: sem ele o Resend recusa a
 * chamada e o SMTP manda um e-mail sem "De:", que cai direto em spam.
 */
export function isMailerConfigured(cfg?: MailerConfig | null): boolean {
  if (!cfg) return false;
  if (!isEmail(cfg.smtpFromEmail)) return false;
  return cfg.emailProvider === 'resend'
    ? !!(cfg.resendApiKey || '').trim()
    : !!(cfg.smtpHost || '').trim();
}

/** O que falta configurar, para a mensagem de erro ser útil no painel. */
export function mailerMissingConfig(cfg?: MailerConfig | null): string {
  if (!cfg) return 'Configure o envio de e-mail em Integrações.';
  if (!isEmail(cfg.smtpFromEmail)) return 'Preencha o "E-mail do Remetente" em Integrações → Envio de E-mail.';
  if (cfg.emailProvider === 'resend' && !(cfg.resendApiKey || '').trim()) {
    return 'Preencha a Resend API Key em Integrações → Envio de E-mail.';
  }
  if (cfg.emailProvider !== 'resend' && !(cfg.smtpHost || '').trim()) {
    return 'Preencha o servidor SMTP em Integrações → Envio de E-mail.';
  }
  return '';
}

function fromAddress(cfg: MailerConfig): string {
  const email = (cfg.smtpFromEmail || '').trim();
  const name = (cfg.smtpFromName || '').trim();
  return name ? `${name} <${email}>` : email;
}

// Texto puro a partir do HTML, para clientes que não renderizam HTML e para
// melhorar a reputação anti-spam da mensagem.
function htmlToText(html: string): string {
  return String(html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .split('\n').map((l) => l.trim()).join('\n')
    .trim();
}

async function sendViaResend(cfg: MailerConfig, msg: MailMessage): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${(cfg.resendApiKey || '').trim()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: fromAddress(cfg),
      to: [msg.to],
      subject: msg.subject,
      html: msg.html,
      text: msg.text || htmlToText(msg.html)
    })
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || data?.error?.message || `Resend: falha ao enviar (HTTP ${res.status})`);
  }
}

/**
 * Resolve o servidor para um endereço IPv4.
 *
 * Por que não deixar o nodemailer resolver: ele junta os endereços IPv4 e IPv6
 * do servidor e escolhe UM AO ACASO (shared/index.js: `addresses[Math.random()
 * * addresses.length]`), sem tentar o próximo quando a conexão falha. Num host
 * sem rota IPv6 — o caso da maioria das hospedagens de aplicação — isso faz o
 * envio falhar de forma intermitente, com "connect ENETUNREACH <endereço v6>",
 * que se parece com erro de senha e não é.
 *
 * Entregando o IP já resolvido, o nodemailer pula a própria resolução
 * (`net.isIP(host)` → "nothing to do here") e a escolha aleatória some.
 *
 * Devolve null quando não há registro IPv4 — aí o servidor é IPv6 de verdade e
 * vale deixar o nodemailer seguir com o nome.
 */
async function resolveIPv4Host(host: string): Promise<string | null> {
  if (!host || net.isIP(host)) return null;
  try {
    const addresses = await dns.resolve4(host);
    return addresses?.[0] || null;
  } catch {
    return null;
  }
}

async function sendViaSmtp(cfg: MailerConfig, msg: MailMessage): Promise<void> {
  const port = Number(cfg.smtpPort) || 587;
  const hostname = (cfg.smtpHost || '').trim();
  const ipv4 = await resolveIPv4Host(hostname);
  const transport = nodemailer.createTransport({
    // Conecta no IPv4 resolvido, mas valida o certificado contra o NOME: sem o
    // servername o TLS compararia o certificado com o IP e recusaria.
    host: ipv4 || hostname,
    ...(ipv4 ? { tls: { servername: hostname } } : {}),
    port,
    // A porta 465 fala TLS desde o primeiro byte; 587 começa em claro e sobe
    // para TLS com STARTTLS. Marcar errado trava a conexão até o timeout.
    secure: cfg.smtpSecure === true || port === 465,
    auth: (cfg.smtpUser || '').trim()
      ? { user: (cfg.smtpUser || '').trim(), pass: cfg.smtpPassword || '' }
      : undefined,
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 20_000
  });
  try {
    await transport.sendMail({
      from: fromAddress(cfg),
      to: msg.to,
      subject: msg.subject,
      html: msg.html,
      text: msg.text || htmlToText(msg.html)
    });
  } catch (e: any) {
    throw new Error(explainSmtpError(e, hostname, port));
  }
}

/**
 * Traduz a falha do SMTP para algo acionável.
 *
 * A mensagem crua ("connect ENETUNREACH 2606:4700:...:465") parece erro de
 * senha e não é: nem chegou a haver autenticação. Sem esta tradução o próximo
 * passo vira tentativa e erro em cima da credencial errada.
 */
export function explainSmtpError(e: any, host: string, port: number): string {
  const raw = String(e?.message || e);
  const where = `${host}:${port}`;

  // O nodemailer embrulha a falha do socket e reescreve o `code` como ESOCKET
  // ou ETIMEDOUT, mas preserva o texto original ("connect ENETUNREACH ..."). Ler
  // só o código faria toda falha de rede virar "tempo esgotado".
  const codes = [String(e?.code || ''), String(e?.errno || ''), raw];
  const has = (needle: string) => codes.some(c => c.includes(needle));

  const code =
    has('ENETUNREACH') ? 'ENETUNREACH'
    : has('EHOSTUNREACH') ? 'EHOSTUNREACH'
    : has('ECONNREFUSED') ? 'ECONNREFUSED'
    : has('EAUTH') || /Invalid login|authentication fail/i.test(raw) ? 'EAUTH'
    : has('EENVELOPE') ? 'EENVELOPE'
    : has('EDNS') || has('ENOTFOUND') || has('EAI_AGAIN') ? 'EDNS'
    : has('ETIMEDOUT') || has('ESOCKET') ? 'ETIMEDOUT'
    : String(e?.code || '');

  switch (code) {
    case 'ENETUNREACH':
    case 'EHOSTUNREACH':
      return `Não há rota de rede até ${where}. Costuma ser o servidor tentando IPv6 sem ter saída IPv6, ` +
        `ou a porta ${port} bloqueada pela hospedagem. Se o problema persistir, tente a porta 587 ` +
        `(sem "conexão segura") ou use o Resend. (${raw})`;
    case 'ECONNREFUSED':
      return `O servidor ${where} recusou a conexão. Confira o endereço e a porta — ` +
        `465 exige "conexão segura" marcada; 587 exige desmarcada. (${raw})`;
    case 'ETIMEDOUT':
    case 'ESOCKET':
      return `Tempo esgotado ao falar com ${where}. Verifique se a hospedagem libera a porta ${port} para saída. (${raw})`;
    case 'EAUTH':
      return `Usuário ou senha recusados por ${host}. Use o e-mail completo como usuário e a senha da caixa de e-mail. (${raw})`;
    case 'EENVELOPE':
      return `O servidor recusou o remetente ou o destinatário. O "E-mail do Remetente" precisa ser uma caixa real deste domínio. (${raw})`;
    case 'EDNS':
      return `Não foi possível resolver o endereço "${host}". Confira se está escrito corretamente. (${raw})`;
    default:
      return raw;
  }
}

/** Envia a mensagem. Lança em qualquer falha — o chamador decide o que fazer. */
export async function sendMail(cfg: MailerConfig, msg: MailMessage): Promise<void> {
  if (!isMailerConfigured(cfg)) throw new Error(mailerMissingConfig(cfg) || 'Envio de e-mail não configurado.');
  if (!isEmail(msg.to)) throw new Error('E-mail do destinatário inválido.');
  if (cfg.emailProvider === 'resend') return sendViaResend(cfg, msg);
  return sendViaSmtp(cfg, msg);
}

// --- Modelo visual ---

function escapeHtml(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface EmailLayoutInput {
  brand: string;
  title: string;
  /** Blocos de conteúdo já escapados/renderizados, em ordem. */
  bodyHtml: string;
  footerNote?: string;
}

/**
 * Casca do e-mail: tabela de largura fixa e estilo inline, porque cliente de
 * e-mail ignora <style> externo e boa parte do CSS moderno.
 */
export function renderEmailLayout({ brand, title, bodyHtml, footerNote }: EmailLayoutInput): string {
  const safeBrand = escapeHtml(brand);
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:24px 12px;background:#f4f4fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#33324a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">
    <tr><td style="background:#480bbc;padding:20px 28px;">
      <span style="color:#ffffff;font-size:18px;font-weight:800;letter-spacing:-.3px;">${safeBrand}</span>
    </td></tr>
    <tr><td style="padding:28px;">
      <h1 style="margin:0 0 16px;font-size:20px;line-height:1.3;color:#1f1b33;">${escapeHtml(title)}</h1>
      ${bodyHtml}
    </td></tr>
    <tr><td style="padding:18px 28px 24px;border-top:1px solid #ececf5;">
      <p style="margin:0;font-size:12px;line-height:1.6;color:#8a89a0;">
        ${escapeHtml(footerNote || `Este é um e-mail automático de ${brand}. Se precisar de ajuda, responda esta mensagem.`)}
      </p>
    </td></tr>
  </table>
</body></html>`;
}

export interface OrderIssueEmailInput {
  brand: string;
  orderId: string;
  serviceLabel?: string;
  targetProfile?: string;
  reasonTitle: string;
  reasonDetails?: string;
  supportEmail?: string;
  supportWhatsapp?: string;
}

/** E-mail avisando o cliente do problema encontrado no pedido. */
export function renderOrderIssueEmail(input: OrderIssueEmailInput): { subject: string; html: string } {
  const {
    brand, orderId, serviceLabel, targetProfile,
    reasonTitle, reasonDetails, supportEmail, supportWhatsapp
  } = input;

  const row = (label: string, value: string) => `
    <tr>
      <td style="padding:6px 0;font-size:13px;color:#8a89a0;width:40%;">${escapeHtml(label)}</td>
      <td style="padding:6px 0;font-size:13px;color:#1f1b33;font-weight:600;">${escapeHtml(value)}</td>
    </tr>`;

  const details = (reasonDetails || '').trim();
  const contactLines: string[] = [];
  if (supportWhatsapp) contactLines.push(`WhatsApp: ${supportWhatsapp}`);
  if (supportEmail) contactLines.push(`E-mail: ${supportEmail}`);

  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#33324a;">
      Encontramos um problema com o seu pedido e ele está aguardando um ajuste da sua parte.
    </p>

    <div style="margin:0 0 20px;padding:16px 18px;background:#fff7ed;border-left:4px solid #f59e0b;border-radius:8px;">
      <p style="margin:0;font-size:15px;font-weight:700;color:#92400e;">${escapeHtml(reasonTitle)}</p>
      ${details ? `<p style="margin:8px 0 0;font-size:14px;line-height:1.6;color:#78350f;white-space:pre-line;">${escapeHtml(details)}</p>` : ''}
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
      ${row('Pedido', `#${orderId}`)}
      ${serviceLabel ? row('Serviço', serviceLabel) : ''}
      ${targetProfile ? row('Perfil informado', targetProfile) : ''}
    </table>

    ${contactLines.length ? `
    <p style="margin:0;font-size:14px;line-height:1.7;color:#33324a;">
      Assim que resolver, é só nos avisar que retomamos a entrega.<br>
      ${contactLines.map((l) => escapeHtml(l)).join('<br>')}
    </p>` : `
    <p style="margin:0;font-size:14px;line-height:1.7;color:#33324a;">
      Assim que resolver, é só responder este e-mail que retomamos a entrega.
    </p>`}
  `;

  return {
    subject: `Pedido #${orderId}: ${reasonTitle}`,
    html: renderEmailLayout({
      brand,
      title: 'Precisamos de um ajuste no seu pedido',
      bodyHtml,
      footerNote: `Você recebeu este aviso porque fez um pedido em ${brand}.`
    })
  };
}
