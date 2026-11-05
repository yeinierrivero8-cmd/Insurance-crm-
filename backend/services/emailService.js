/**
 * Email Service — SendGrid Integration (Skeleton)
 * Handles: renewal notifications, policy expiry alerts, welcome emails
 * Mock mode for development, real sending in production
 */

const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.mockMode = process.env.NODE_ENV !== 'production' || !process.env.SENDGRID_API_KEY;
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@insuraflow.com';
    this.fromName = process.env.FROM_NAME || 'InsuraFlow';

    if (!this.mockMode && process.env.SENDGRID_API_KEY) {
      // Initialize SendGrid transporter
      // TODO: Replace with SendGrid SDK when available
      console.log('[EMAIL] SendGrid configured');
    } else {
      console.log('[EMAIL] Running in MOCK mode (development)');
    }
  }

  /**
   * Send renewal due notification
   */
  async sendRenewalDueNotification(to, client, policy, daysUntilDue) {
    const subject = `Renovación próxima: ${policy.type} - ${client.name}`;
    const htmlContent = `
      <h2>Renovación Próxima</h2>
      <p>Hola,</p>
      <p>La póliza de <strong>${policy.type}</strong> de <strong>${client.name}</strong> vence en <strong>${daysUntilDue} días</strong>.</p>
      <p><strong>Detalles:</strong></p>
      <ul>
        <li>Número de póliza: ${policy.policy_number}</li>
        <li>Cliente: ${client.name}</li>
        <li>Fecha de vencimiento: ${policy.end_date}</li>
        <li>Prima: $${policy.premium}</li>
      </ul>
      <p><a href="${process.env.APP_URL}/renewals">Ver renovaciones →</a></p>
      <p>InsuraFlow CRM</p>
    `;

    return this.send({
      to,
      subject,
      htmlContent,
      data: {
        type: 'renewal_due',
        client_id: client.id,
        policy_id: policy.id,
        days_until_due: daysUntilDue
      }
    });
  }

  /**
   * Send policy expiry alert
   */
  async sendPolicyExpiryAlert(to, client, policy) {
    const subject = `Alerta: Póliza expirada - ${client.name}`;
    const htmlContent = `
      <h2>Alerta de Póliza Expirada</h2>
      <p>La póliza de <strong>${policy.type}</strong> de <strong>${client.name}</strong> ha expirado.</p>
      <p><strong>Detalles:</strong></p>
      <ul>
        <li>Número de póliza: ${policy.policy_number}</li>
        <li>Tipo: ${policy.type}</li>
        <li>Fecha de vencimiento: ${policy.end_date}</li>
      </ul>
      <p><a href="${process.env.APP_URL}/clients/${client.id}">Actualizar cliente →</a></p>
    `;

    return this.send({
      to,
      subject,
      htmlContent,
      data: {
        type: 'policy_expiry',
        client_id: client.id,
        policy_id: policy.id
      }
    });
  }

  /**
   * Send welcome email to new users
   */
  async sendWelcomeEmail(to, userName) {
    const subject = 'Bienvenido a InsuraFlow CRM';
    const htmlContent = `
      <h2>Bienvenido a InsuraFlow</h2>
      <p>Hola <strong>${userName}</strong>,</p>
      <p>Tu cuenta ha sido creada exitosamente. Estamos listos para ayudarte a gestionar tus clientes y pólizas.</p>
      <h3>Próximos pasos:</h3>
      <ol>
        <li>Completa tu perfil</li>
        <li>Agrega tus primeros clientes</li>
        <li>Configura tus pólizas</li>
        <li>Habilita renovaciones automáticas</li>
      </ol>
      <p><a href="${process.env.APP_URL}/settings">Ir a configuración →</a></p>
      <p>¿Preguntas? Contacta a support@insuraflow.com</p>
    `;

    return this.send({
      to,
      subject,
      htmlContent,
      data: {
        type: 'welcome',
        user_email: to
      }
    });
  }

  /**
   * Send commission summary email
   */
  async sendCommissionSummaryEmail(to, agencyName, period, totalCommission, commissions) {
    const subject = `Resumen de Comisiones - ${period}`;
    const htmlContent = `
      <h2>Resumen de Comisiones</h2>
      <p>Agencia: <strong>${agencyName}</strong></p>
      <p>Período: <strong>${period}</strong></p>
      <h3>Comisiones</h3>
      <table border="1" cellpadding="10" style="border-collapse: collapse;">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Tipo de Póliza</th>
            <th>Comisión</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          ${commissions.map(c => `
            <tr>
              <td>${c.client_name}</td>
              <td>${c.policy_type}</td>
              <td>$${c.amount.toFixed(2)}</td>
              <td>${c.date}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <h3>Total: $${totalCommission.toFixed(2)}</h3>
    `;

    return this.send({
      to,
      subject,
      htmlContent,
      data: {
        type: 'commission_summary',
        period,
        total: totalCommission
      }
    });
  }

  /**
   * Core send method
   */
  async send({ to, subject, htmlContent, textContent, data }) {
    if (this.mockMode) {
      console.log(`[EMAIL] 📧 Mock send (${data.type}):`, {
        to,
        subject,
        timestamp: new Date().toISOString()
      });
      return {
        success: true,
        messageId: `mock-${Date.now()}`,
        mode: 'mock',
        message: 'Email sent in mock mode'
      };
    }

    try {
      // TODO: Implement real SendGrid send when API key is available
      // For now, return mock response
      console.log(`[EMAIL] 📧 Sending email (production):`, {
        to,
        subject,
        type: data.type
      });

      return {
        success: true,
        messageId: `sg-${Date.now()}`,
        to,
        subject,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('[EMAIL] ❌ Failed to send email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Queue email for later delivery (for high-volume scenarios)
   */
  async queue(emailData) {
    console.log(`[EMAIL] 📬 Queued email:`, {
      to: emailData.to,
      type: emailData.data.type,
      timestamp: new Date().toISOString()
    });

    // TODO: Implement email queue in database
    return {
      queued: true,
      queueId: `queue-${Date.now()}`
    };
  }

  /**
   * Get email service status
   */
  getStatus() {
    return {
      mode: this.mockMode ? 'mock' : 'production',
      fromEmail: this.fromEmail,
      configuredProviders: this.mockMode ? ['mock'] : ['sendgrid'],
      timestamp: new Date().toISOString()
    };
  }
}

// Export singleton
module.exports = new EmailService();
