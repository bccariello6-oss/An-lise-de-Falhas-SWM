# Prompt de Recriação: Sistema "Análise de Falha - AF" (SWM Brasil)

Atue como Dev Senior. Recrie a aplicação React (Vite+TS) "Análise de Falha - AF" da SWM Brasil. O objetivo é criar uma cópia idêntica (visual e funcional), porém com código refatorado e limpo.

## 1. Estrutura de Arquivos e Dependências
- **package.json:** React 19, Vite, `@dnd-kit/core` (drag-and-drop Kanban), `@google/genai` (texto IA), `@supabase/supabase-js`, `recharts`, `lucide-react`.
- **`index.html`:** Entry point, define variáveis CSS do tema e regras `@media print` brutas para A4.
- **`src/App.tsx`:** Arquivo central que gerencia os 9 passos da Análise, estado global, autenticação e a geração inline da versão de impressão (um bloco HTML/CSS gigante em `handleViewReport`).
- **`src/components/`:** `Dashboard.tsx`, `EvidenceModal.tsx`, `IshikawaComponent.tsx`, `KanbanView.tsx`, `Login.tsx`.
- **`src/services/`:** `geminiService.ts` (gera "Fenômeno"), `supabaseService.ts`, `notificationService.ts`.
- **`src/types.ts` e `constants.tsx`:** Declarações de `Analysis`, `Action`, e constantes (STEPS).

## 2. Navegação (Sem Router)
A navegação não usa React Router. É controlada via estado local no App (`currentStep`) e salva no localStorage, progredindo nestas fases:
1. Identificação Geral
2. 5W1H (O Quê, Onde, Quando, Quem, Como, Quanto)
3. Verificação (Sintoma, Histórico, Fenômeno IA)
4. Ishikawa (Diagrama 6M)
5. 5 Porquês (Matriz encadeada iterativa)
6. Plano de Ação (5W2H)
7. Resultados e Verificação de Eficácia
8. Kanban (Gestão visual das Ações)
9. Dashboard

## 3. Identidade Visual (Tema Corporativo)
- Atualmente usa **Tailwind CSS via CDN**. A tipografia primária é **Century Gothic** (via woff local).
- **Cores corporativas SWM:** 
  - `--swm-blue: #171C8F`
  - `--swm-light-blue: #13aff0`
  - `--swm-bg: #F9F9F9`
- O "Relatório Final" (`handleViewReport` em App.tsx) precisa continuar abrindo como pop-up limpo, usando CSS `@page { size: A4 }` ocultando cabeçalhos e menus para permitir o recurso nativo "Salvar em PDF".

## 4. Estrutura de Dados
Tudo gravado num objeto gigante `Analysis`:
- **`whys`**: Matriz interativa de rodadas (linha A, B, C... para descobrir causa raiz).
- **`ishikawa`**: Divisão das causas em máquina, método, material, mão-de-obra, medição e meio ambiente.
- **`actions`**: Array listando O que, Quem, Quando - integrado diretamente com Kanban.

## 5. Diretrizes do que Reproduzir e Melhorar

**Manter (Cópia Exata):**
- As cores corporativas, validações rígidas ao pular etapas, os formulários com o MESMO escopo.
- A mesmíssima fidelidade ao relatório visual em PDF (as tabelas, fontes e grid devem ser idênticas ao legado).
- Funções de auth, salvamento de rascunhos no Supabase e integrações com Gemini.

**Refatorar/Simplificar:**
- O `App.tsx` atual passa de 1600 linhas. Você deve picotar os "Passos" em componentes menores (ex: `Step1Identification.tsx`, `Step25W1H.tsx`).
- O bloco grotesco de HTML string do Relatório em `App.tsx` deve ir para um arquivo dedicado ou componente oculto de renderização.
- Configure o Tailwind via Node/Vite (arquivo `tailwind.config.js` próprio) removendo a importação CDN do `index.html`.
