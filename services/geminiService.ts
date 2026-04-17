
import { GoogleGenAI } from "@google/genai";
import { Analysis } from "../types";

// Corrected: Use import.meta.env for Vite or define a fallback for safety.
const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey: apiKey });

export async function generateSummary(analysis: Analysis): Promise<string> {
  const prompt = `
    Como um especialista em confiabilidade industrial, analise os seguintes dados de uma falha e gere um resumo executivo técnico e conciso (máximo 150 palavras).
    Destaque a causa raiz e a ação principal recomendada.

    DADOS:
    Equipamento: ${analysis.equipment}
    Descrição: ${analysis.description}
    5 Porquês: ${Array.isArray(analysis.whys) ? analysis.whys.filter(w => w).join(' -> ') : Object.entries(analysis.whys).map(([col, values]) => values.some(v=>v) ? `[Col ${col}: ${values.filter(v=>v).join(' -> ')}]` : '').filter(Boolean).join(' | ')}
    Causa Raiz: ${analysis.rootCause}
    Ishikawa (Máquina): ${analysis.ishikawa.machine.causes.join(', ')}
    Plano de Ação: ${analysis.actions.map(a => a.description).join('; ')}
  `;

  try {
    // Corrected: Use ai.models.generateContent with model and contents together.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { temperature: 0.7 }
    });
    // Corrected: Access response text as a property.
    return response.text || "Não foi possível gerar o resumo automático.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Erro ao processar resumo com IA.";
  }
}

export async function suggestRootCause(analysis: Analysis): Promise<string> {
  const prompt = `
    Com base na descrição da falha e no detalhamento fornecido, sugira uma possível causa raiz técnica.
    Descrição: ${analysis.description}
    Sintoma: ${analysis.symptom}
    Histórico: ${analysis.history}
    Responda apenas com a sugestão curta da causa raiz.
  `;

  try {
    // Corrected: Use ai.models.generateContent with model and contents together.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { temperature: 0.5 }
    });
    // Corrected: Access response text as a property.
    return response.text?.trim() || "Análise necessária";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Falha na sugestão automática.";
  }
}
