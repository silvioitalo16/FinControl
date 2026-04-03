# Configuração do Supabase MCP no Claude Code

Guia baseado na configuração real do projeto GameStats.

---

## Pré-requisitos

- Claude Code instalado (v2.1.90+)
- Conta no Supabase com um projeto criado
- Claude Code CLI disponível no terminal

---

## Passo 1 — Obter o Project Ref

No painel do Supabase, acesse **Project Settings → General** e copie o **Reference ID** do projeto (ex: `hgkubyedcnpxuoakhduy`).

---

## Passo 2 — Registrar o servidor MCP

Abra um terminal externo (PowerShell ou cmd, **não** a extensão do VS Code) e execute:

```powershell
claude mcp add --scope user --transport http supabase "https://mcp.supabase.com/mcp?project_ref=SEU_PROJECT_REF"
```

Substitua `SEU_PROJECT_REF` pelo Reference ID copiado no passo anterior.

Este comando salva a configuração em `C:\Users\<seu-usuario>\.claude.json`.

---

## Passo 3 — Autenticar via OAuth

No mesmo terminal, execute:

```powershell
claude /mcp
```

Na interface interativa:
1. Navegue com `↑↓` até o servidor `supabase`
2. Pressione **Enter** para selecionar
3. Escolha **Authenticate**
4. Um browser abrirá para login no Supabase
5. Após autenticar, o terminal exibirá:
   ```
   Authentication successful. Connected to supabase.
   ```

---

## Passo 4 — Configuração no projeto (opcional)

Para que o MCP seja reconhecido também no escopo do projeto, crie o arquivo `.claude/settings.json` na raiz do repositório:

```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=SEU_PROJECT_REF"
    }
  }
}
```

> **Nota:** A autenticação (token OAuth) fica armazenada no `.claude.json` do usuário. Este arquivo de projeto apenas aponta para o servidor correto.

---

## Passo 5 — Ativar na extensão do VS Code

Após autenticar, reinicie a sessão do Claude Code no VS Code:

- `Ctrl+Shift+P` → **Claude Code: Restart**  
- Ou feche e reabra o VS Code

O MCP será carregado e as ferramentas do Supabase estarão disponíveis na sessão.

---

## Verificação

Para confirmar que o MCP está ativo, peça ao Claude:

> "verifique se o MCP do Supabase está ativo"

Se as ferramentas estiverem carregadas, o Claude conseguirá listar tabelas, executar queries e interagir com o banco.

---

## Observações

- O `~/.claude/settings.json` global é diferente do `~/.claude.json` — o CLI usa o `.claude.json` para armazenar servidores MCP registrados via `claude mcp add`
- A autenticação OAuth é persistida automaticamente; não é necessário re-autenticar a cada sessão
- O `project_ref` na URL garante que o MCP aponte para o projeto correto do Supabase
