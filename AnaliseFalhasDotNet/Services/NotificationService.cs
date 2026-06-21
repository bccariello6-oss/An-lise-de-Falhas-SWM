using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using AnaliseFalhasDotNet.Models;

namespace AnaliseFalhasDotNet.Services
{
    public class NotificationService
    {
        private readonly HttpClient _httpClient;
        private readonly string _resendApiKey;
        private readonly string _adminEmail;
        private readonly string _fromAddress;

        public NotificationService(HttpClient httpClient, IConfiguration config)
        {
            _httpClient = httpClient;
            _resendApiKey = config["Email:ResendApiKey"] ?? string.Empty;
            _adminEmail = config["Email:AdminEmail"] ?? string.Empty;
            _fromAddress = config["Email:FromAddress"] ?? "ARP SWM Brasil <noreply@seudominio.com.br>";
        }

        public async Task<bool> SendReportEmailAsync(Analysis analysis, string pdfDataUrl)
        {
            if (string.IsNullOrEmpty(_resendApiKey)) return false;

            // Esta seria a lógica de envio direto via API Resend,
            // substituindo a necessidade da Edge Function do Supabase.

            var htmlContent = $@"
                <div style='font-family: sans-serif;'>
                    <h2>Nova Análise de Falha Submetida</h2>
                    <p><strong>Equipamento:</strong> {analysis.Equipment}</p>
                    <p><strong>Sintoma:</strong> {analysis.Symptom}</p>
                    <p><strong>Causa Raiz:</strong> {analysis.RootCause}</p>
                    <p>Por favor, veja o relatório em PDF anexo.</p>
                </div>
            ";

            // Processar PDF base64 (remover header)
            var base64Data = pdfDataUrl.Split(',').Length > 1 ? pdfDataUrl.Split(',')[1] : pdfDataUrl;

            var requestBody = new
            {
                from = _fromAddress,
                to = new[] { _adminEmail },
                subject = $"AF {analysis.SequentialNumber:D4} - {analysis.Equipment}",
                html = htmlContent,
                attachments = new[]
                {
                    new {
                        filename = $"AF_{analysis.SequentialNumber:D4}_{analysis.Equipment}.pdf",
                        content = base64Data
                    }
                }
            };

            _httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _resendApiKey);
            var response = await _httpClient.PostAsJsonAsync("https://api.resend.com/emails", requestBody);

            return response.IsSuccessStatusCode;
        }
    }
}
