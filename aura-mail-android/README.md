# Aura Mail — cliente de e-mail Android com IA

Alternativa moderna ao Outlook 365 para Android, em **Kotlin + Jetpack Compose (Material 3 / Material You)**, ligada ao **Microsoft 365 via Microsoft Graph** e com IA **Claude** (SDK oficial `anthropic-java`).

## Funcionalidades

| Área | O que faz |
|---|---|
| **Pesquisa inteligente** | Escreva ou diga como falaria (“faturas da EDP com anexo do mês passado”). A IA converte em filtros (remetente, datas, anexos, palavras-chave → KQL do Graph), mostra-os como chips e, se for uma pergunta (“quando é o meu voo?”), **responde com base nos e-mails**. Resultados instantâneos por palavra-chave enquanto escreve. |
| **Escrita com IA** | Barra de IA fixa no editor: descreva o e-mail e ele é gerado em streaming. Ações rápidas: Melhorar, Encurtar, Desenvolver, Formal, Próximo, Corrigir, Tópicos, Traduzir. Desfazer ilimitado das alterações da IA. |
| **Voz** | *Ditar* (texto inserido e limpo pela IA — sem hesitações, com pontuação) ou *Falar com a IA* (“responde a aceitar a reunião de quinta”). Transcrição em tempo real, animação reativa ao volume, idioma configurável. |
| **Memória de modelos** | Modelos guardados localmente (Room) com variáveis `{{nome}}`. A IA escolhe automaticamente os mais relevantes para cada rascunho e preenche as variáveis. “Guardar como modelo” transforma qualquer e-mail num modelo (a IA generaliza nomes/datas). Também cria modelos a partir de uma descrição. Modelos fixados são sempre considerados. |
| **Leitura** | Resumo inteligente, lista de tarefas/prazos e 3 respostas sugeridas com um toque. |
| **Caixa de entrada** | Briefing do dia dos não lidos, deslizar para arquivar/eliminar, pull-to-refresh, pastas, modo claro/escuro e cores dinâmicas. |
| **Modo demonstração** | Funciona sem conta Microsoft (caixa de exemplo) para experimentar logo. |

## Estrutura

```
app/src/main/java/com/auramail/
├── ai/AiAssistant.kt          # Toda a IA (Claude): redação, reescrita, pesquisa, resumos, modelos
├── speech/SpeechInput.kt      # Reconhecimento de voz nativo como Flow
├── data/
│   ├── auth/AuthManager.kt    # MSAL (Microsoft Entra ID)
│   ├── graph/                 # Retrofit para Microsoft Graph
│   ├── mail/                  # Repositório Graph + Demo
│   ├── templates/             # Room: memória de modelos + recuperação por relevância
│   └── settings/              # DataStore + chave cifrada (EncryptedSharedPreferences)
├── di/AppContainer.kt         # Injeção de dependências manual
└── ui/                        # Ecrãs Compose: inbox, reader, compose, search, templates, settings
```

## Como correr

1. Abra a pasta `aura-mail-android` no **Android Studio** (Ladybug ou mais recente) e deixe sincronizar o Gradle.
2. Execute num dispositivo/emulador Android 8.0+ (API 26). Arranca em modo demonstração.
3. Em **Definições → Inteligência artificial**, cole a sua chave da API Anthropic (platform.claude.com). Escolha o modelo (por omissão Claude Opus 5.5; Sonnet/Haiku 5.5 para respostas mais rápidas/baratas).

### Ligar ao Microsoft 365 / Outlook

1. Em [entra.microsoft.com](https://entra.microsoft.com) → *App registrations* → *New registration* (contas de qualquer organização + pessoais).
2. *Authentication* → *Add platform* → **Android**: package `com.auramail` e a *signature hash* da sua keystore
   (`keytool -exportcert -alias androiddebugkey -keystore ~/.android/debug.keystore | openssl sha1 -binary | openssl base64`, password `android`).
3. *API permissions* (delegadas): `User.Read`, `Mail.ReadWrite`, `Mail.Send`.
4. Preencha `app/src/main/res/raw/msal_config.json` (`client_id`, `redirect_uri`) e substitua `REPLACE_WITH_SIGNATURE_HASH` no `AndroidManifest.xml` pela hash (não codificada em URL).
5. Definições → **Iniciar sessão com a Microsoft**.

## Notas

- **Chave da API:** é guardada cifrada no dispositivo e excluída dos backups. Para distribuir publicamente, use um pequeno backend/proxy entre a app e a API (não exponha chaves e controle custos por utilizador).
- Pedidos ao Opus/Sonnet incluem *server-side fallbacks* (`fallbacks: "default"`): se um pedido for recusado pelos classificadores de segurança, a API repete-o noutro modelo automaticamente.
- Estado: o código foi escrito sem compilar a app Android completa (ambiente sem SDK Android); o módulo de IA foi compilado e validado contra o SDK `anthropic-java` 3.3.0. Espere eventuais pequenos ajustes no primeiro build no Android Studio.
