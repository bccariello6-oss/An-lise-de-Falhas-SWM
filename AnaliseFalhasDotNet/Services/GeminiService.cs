using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;

namespace AnaliseFalhasDotNet.Services
{
    public class GeminiService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;
        private readonly string _model;

        public GeminiService(HttpClient httpClient, IConfiguration config)
        {
            _httpClient = httpClient;
            _apiKey = config["Gemini:ApiKey"] ?? string.Empty;
            _model = config["Gemini:Model"] ?? "gemini-2.0-flash";
        }

        public async Task<string> GeneratePhenomenonAsync(string history, string symptom)
        {
            if (string.IsNullOrEmpty(_apiKey)) return string.Empty;

            var url = $"https://generativelanguage.googleapis.com/v1beta/models/{_model}:generateContent?key={_apiKey}";
            
            var prompt = $"Com base no histórico: '{history}' e sintoma: '{symptom}', descreva o Fenômeno (como a falha se manifesta visivelmente ou operacionalmente) em uma frase concisa e técnica. Não use introduções, retorne apenas o texto do fenômeno.";

            var requestBody = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new[] { new { text = prompt } }
                    }
                }
            };

            var response = await _httpClient.PostAsJsonAsync(url, requestBody);
            
            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                var doc = JsonDocument.Parse(content);
                try
                {
                    var text = doc.RootElement
                        .GetProperty("candidates")[0]
                        .GetProperty("content")
                        .GetProperty("parts")[0]
                        .GetProperty("text").GetString();
                        
                    return text?.Trim() ?? string.Empty;
                }
                catch
                {
                    return string.Empty;
                }
            }

            return string.Empty;
        }
        
        public async Task<string> GenerateRootCauseSuggestionAsync(Models.Analysis analysis)
        {
             if (string.IsNullOrEmpty(_apiKey)) return string.Empty;

            var url = $"https://generativelanguage.googleapis.com/v1beta/models/{_model}:generateContent?key={_apiKey}";
            
            // Constructing a detailed prompt using analysis data
            var prompt = $"Analise os seguintes dados de uma falha industrial e sugira a causa raiz de forma direta e concisa (máximo 2 linhas):\n";
            prompt += $"Equipamento: {analysis.Equipment}, Sintoma: {analysis.Symptom}\n";
            
            // ... (adding more details from 5W1H and WhysMatrix to the prompt as in original React app)

            var requestBody = new
            {
                contents = new[] { new { parts = new[] { new { text = prompt } } } }
            };

            var response = await _httpClient.PostAsJsonAsync(url, requestBody);
            
            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                var doc = JsonDocument.Parse(content);
                try
                {
                    return doc.RootElement
                        .GetProperty("candidates")[0]
                        .GetProperty("content")
                        .GetProperty("parts")[0]
                        .GetProperty("text").GetString()?.Trim() ?? string.Empty;
                }
                catch { return string.Empty; }
            }

            return string.Empty;
        }
    }
}
