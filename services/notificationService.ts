import type { Analysis } from '../types';
import { supabase } from '../lib/supabase';

interface NotificationPayload {
  analysis: Analysis;
  authorName: string;
}

export const sendAnalysisNotification = async ({ analysis, authorName }: NotificationPayload): Promise<boolean> => {
  const resendApiKey = import.meta.env.VITE_RESEND_API_KEY;
  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;

  if (!resendApiKey || resendApiKey.startsWith('re_') === false) {
    console.warn('[Notification] Resend API key not configured');
    return false;
  }

  if (!adminEmail) {
    console.warn('[Notification] Admin email not configured');
    return false;
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const functionUrl = `${supabaseUrl}/functions/v1/send-report-email`;

  const subject = `[ARP] Nova Análise Finalizada - ${analysis.equipment || 'Equipamento'} (${analysis.area || 'N/A'})`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; 
          background-color: #f8fafc; 
          margin: 0; 
          padding: 20px;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background: white; 
          border-radius: 12px; 
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #171C8F 0%, #13aff0 100%);
          padding: 24px;
          color: white;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
        }
        .header p {
          margin: 8px 0 0;
          opacity: 0.9;
          font-size: 14px;
        }
        .content {
          padding: 24px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 20px;
        }
        .info-item {
          background: #f8fafc;
          padding: 12px 16px;
          border-radius: 8px;
          border-left: 3px solid #171C8F;
        }
        .info-item label {
          display: block;
          font-size: 11px;
          color: #64748b;
          text-transform: uppercase;
          font-weight: 600;
          margin-bottom: 4px;
        }
        .info-item value {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
        }
        .description-box {
          background: #f8fafc;
          padding: 16px;
          border-radius: 8px;
          margin-top: 16px;
        }
        .description-box label {
          display: block;
          font-size: 11px;
          color: #64748b;
          text-transform: uppercase;
          font-weight: 600;
          margin-bottom: 8px;
        }
        .description-box p {
          margin: 0;
          font-size: 14px;
          color: #1e293b;
          line-height: 1.6;
        }
        .actions-summary {
          margin-top: 20px;
          padding: 16px;
          background: #f0fdf4;
          border-radius: 8px;
          border: 1px solid #bbf7d0;
        }
        .actions-summary h3 {
          margin: 0 0 12px;
          font-size: 14px;
          color: #166534;
        }
        .action-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #dcfce7;
        }
        .action-item:last-child {
          border-bottom: none;
        }
        .action-type {
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 600;
        }
        .type-corretiva { background: #fee2e2; color: #991b1b; }
        .type-preventiva { background: #dbeafe; color: #1e40af; }
        .type-melhoria { background: #fef3c7; color: #92400e; }
        .footer {
          padding: 16px 24px;
          background: #f1f5f9;
          text-align: center;
        }
        .footer p {
          margin: 0;
          font-size: 12px;
          color: #64748b;
        }
        .btn {
          display: inline-block;
          background: #171C8F;
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          margin-top: 16px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Nova Análise de Falha Finalizada</h1>
          <p>SWM Brasil - Liderança Opex</p>
        </div>
        <div class="content">
          <div class="info-grid">
            <div class="info-item">
              <label>Equipamento</label>
              <value>${analysis.equipment || '-'}</value>
            </div>
            <div class="info-item">
              <label>Área</label>
              <value>${analysis.area || '-'}</value>
            </div>
            <div class="info-item">
              <label>Responsável</label>
              <value>${authorName || '-'}</value>
            </div>
            <div class="info-item">
              <label>Data da Ocorrência</label>
              <value>${analysis.failureDate || '-'}</value>
            </div>
            <div class="info-item">
              <label>Nº Sequencial</label>
              <value>${analysis.sequentialNumber || '-'}</value>
            </div>
            <div class="info-item">
              <label>Protocolo</label>
              <value>${analysis.id || '-'}</value>
            </div>
          </div>
          
          <div class="description-box">
            <label>Descrição da Falha</label>
            <p>${analysis.description || 'Não informada'}</p>
          </div>
          
          ${analysis.rootCause ? `
          <div class="description-box">
            <label>Causa Raiz Identificada</label>
            <p>${analysis.rootCause}</p>
          </div>
          ` : ''}
          
          ${analysis.actions && analysis.actions.length > 0 ? `
          <div class="actions-summary">
            <h3>Plano de Ações (${analysis.actions.length})</h3>
            ${analysis.actions.map(action => `
              <div class="action-item">
                <span class="action-type type-${action.type === 'Corretiva' ? 'corretiva' : action.type === 'Preventiva' ? 'preventiva' : 'melhoria'}">${action.type}</span>
                <span style="flex: 1; margin: 0 12px; font-size: 13px;">${action.description || '-'}</span>
                <span style="font-size: 12px; color: ${action.status === 'Concluída' ? '#166534' : '#b45309'}; font-weight: 600;">${action.status}</span>
              </div>
            `).join('')}
          </div>
          ` : ''}
        </div>
        <div class="footer">
          <p>Esta notificação foi enviada automaticamente pelo sistema ARP</p>
          <p style="margin-top: 4px; font-size: 11px;">SWM Brasil - Liderança Opex</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'x-resend-api-key': resendApiKey,
      },
      body: JSON.stringify({
        to: [adminEmail],
        subject: subject,
        html: htmlContent,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[Notification] Edge Function error:', error);
      return false;
    }

    const result = await response.json();
    console.log('[Notification] Email sent successfully:', result);
    return true;
  } catch (error) {
    console.error('[Notification] Failed to send email:', error);
    return false;
  }
};

export const notifyNewAnalysis = async (analysis: Analysis, authorName: string): Promise<void> => {
  const sent = await sendAnalysisNotification({ analysis, authorName });
  if (sent) {
    console.log(`[Notification] Admin notified for analysis ${analysis.id}`);
  }
};