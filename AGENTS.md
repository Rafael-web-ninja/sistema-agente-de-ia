# ⚡ INSTRUÇÕES DE EXECUÇÃO RÁPIDA - ZAPCHAT

> **REGRA FUNDAMENTAL**: Priorize velocidade, precisão cirúrgica e simplicidade. 
> Alterações simples de front-end (ajuste visual, troca de ícone, adicionar campo, botão, layout) devem levar **menos de 1 minuto** de execução.
> NUNCA passe de 2 a 3 minutos em tarefas rotineiras de interface.

---

## 🚫 PROIBIÇÕES CRÍTICAS (O QUE NUNCA FAZER)

1. **NUNCA tirar prints/screenshots automaticamente**:
   - É terminantemente PROIBIDO rodar scripts de Playwright/Puppeteer ou usar subagentes de navegador apenas para capturar screenshots de verificação.
   - Screenshots/prints geram lentidão de dezenas de minutos, criam arquivos pesados e poluem o repositório.
   - **Exceção única**: Somente capture imagem se o usuário pedir explicitamente: *"tire um print da tela"*.

2. **NUNCA criar scripts de teste descartáveis**:
   - Proibido criar `scripts/test-*.js`, `scripts/capture-*.js`, `scripts/debug-*.js`.
   - Se precisar validar código, valide a sintaxe ou faça conferência estática rápida.

3. **NUNCA fazer over-engineering ou investigações longas**:
   - Para pedidos de front-end ("alterar ícone", "mudar cor", "adicionar botão", "ajustar layout"), vá direto ao ponto. Não passe turnos analisando o sistema inteiro ou lendo arquivos não relacionados.

---

## 🚀 FLUXO DE TRABALHO RÁPIDO (PASSO A PASSO OBRIGATÓRIO)

Toda vez que o usuário pedir uma alteração de front-end, siga estritamente este ciclo de 3 passos:

### Passo 1: Localização Cirúrgica (5 a 15 segundos)
- Use `grep_search` para achar o texto, ID, classe ou componente específico no arquivo correspondente.
- Não leia centenas de linhas se souber o termo exato.

### Passo 2: Edição Direta e Limpa (15 a 30 segundos)
- Aplique a alteração diretamente com `replace_file_content`.
- Altere apenas o trecho necessário, mantendo a consistência com o restante do layout.
- Se a alteração for no `index.html` e envolver sincronizar as páginas estáticas em `html/`, rode apenas:
  ```bash
  node scripts/build-html-pages.js
  ```

### Passo 3: Resposta Imediata e Concisa (5 segundos)
- Responda de forma direta ao usuário confirmando o que foi alterado.
- Inclua links clicáveis para os arquivos alterados (ex: [`index.html`](file:///Users/rafaelmota/Antigravity/ZapChat01/index.html)).
- Não escreva relatórios longos ou explicações desnecessárias.

---

## 📁 MAPA RÁPIDO DA ESTRUTURA DO PROJETO

- **`index.html`**: Aplicação principal (SPA com seções de dashboard, conversas, agentes, leads, canais, configurações, modais).
- **`src/css/`**: Estilos modulares da aplicação:
  - `variables.css`: Variáveis globais (cores, espaçamentos, temas).
  - `layout.css`: Sidebar, headers, containers principais.
  - `components.css`: Botões, badges, modais, inputs, dropdowns.
  - `conversas.css`, `agentes.css`, `editar-agente.css`, `leads.css`, `canais.css`, `settings.css`, `crm.css`, `chatbot.css`: Estilos específicos de cada módulo.
- **`src/js/`**: Lógica de comportamento e interatividade:
  - `app.js`: Inicialização e orquestração.
  - `navigation.js`: Troca de abas e navegação de telas.
  - `chat.js`: Fluxo do chat e conversas.
  - `editar-agente.js`: Configurações e edição de agentes.
  - `leads.js`, `channels.js`, `settings.js`, `theme.js`: Módulos específicos.
  - `data.js`: Mock data e estado inicial.
- **`scripts/build-html-pages.js`**: Construtor das páginas HTML individuais em `html/` a partir de `index.html`.

---

## 🎨 PADRÕES DE DESIGN E UI

- Mantenha a identidade visual limpa, moderna e consistente do ZapChat.
- Use as variáveis CSS existentes (`var(--primary)`, `var(--bg-card)`, etc.) e classes utilitárias de `components.css`.
- Para ícones, use os SVGs inline ou classes SVG existentes no projeto para não quebrar a padronização.
- Suporte a Dark/Light mode: certifique-se de que novos elementos respeitem o tema via classes ou variáveis CSS.
