import "server-only";

import {
  AiError,
  type AiResult,
  type GeneratedImage,
  type ImageInput,
  type ImageProvider,
} from "../types";
import { promptImmagine } from "../prompts";

/**
 * Generazione di immagini su endpoint compatibili con lo schema OpenAI.
 *
 * Lo usano sia Seedream 4.0 (Volcengine Ark) sia Qwen-Image (DashScope):
 * cambiano indirizzo, chiave e nome del modello, non la forma della
 * richiesta. Sostituire il fornitore resta quindi una questione di
 * `.env.local`, come chiede la specifica.
 *
 * ── DA VERIFICARE ──────────────────────────────────────────────────────────
 * Gemini è l'unico percorso che ho potuto provare. Questi due sono scritti
 * sulla forma documentata delle rispettive API ma non sono stati eseguiti,
 * perché non ho le chiavi. Prima di usarli in produzione confrontate
 * indirizzo e nome del modello con la documentazione:
 *
 *   Seedream  https://www.volcengine.com/docs/82379
 *   Qwen      https://help.aliyun.com/zh/model-studio/
 *
 * Se un indirizzo è cambiato si aggiusta qui sotto, in un posto solo.
 * ───────────────────────────────────────────────────────────────────────────
 */

const TIMEOUT_MS = 90_000;

type Config = {
  provider: string;
  endpoint: string;
  apiKeyEnv: string;
  defaultModel: string;
};

const CONFIGURAZIONI: Record<string, Config> = {
  seedream: {
    provider: "seedream",
    endpoint: "https://ark.cn-beijing.volces.com/api/v3/images/generations",
    apiKeyEnv: "SEEDREAM_API_KEY",
    defaultModel: "seedream-4.0",
  },
  qwen: {
    provider: "qwen",
    endpoint:
      "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/images/generations",
    apiKeyEnv: "QWEN_API_KEY",
    defaultModel: "qwen-image-edit",
  },
};

type RispostaImmagini = {
  data?: Array<{ b64_json?: string; url?: string }>;
  usage?: { input_tokens?: number; output_tokens?: number };
  error?: { message?: string };
  message?: string;
};

export class OpenAiCompatibleImageProvider implements ImageProvider {
  readonly provider: string;
  readonly model: string;
  private readonly config: Config;

  constructor(nome: keyof typeof CONFIGURAZIONI, model?: string) {
    const config = CONFIGURAZIONI[nome];
    if (!config) {
      throw new AiError(`Fornitore di immagini sconosciuto: ${nome}.`);
    }
    this.config = config;
    this.provider = config.provider;
    this.model = model ?? process.env.AI_IMAGE_MODEL ?? config.defaultModel;
  }

  async generate(input: ImageInput): Promise<AiResult<GeneratedImage>> {
    const chiave = process.env[this.config.apiKeyEnv];
    if (!chiave) {
      throw new AiError(
        `Manca ${this.config.apiKeyEnv}. Serve per generare immagini con ${this.provider}.`
      );
    }

    let risposta: Response;
    try {
      risposta = await fetch(this.config.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${chiave}`,
        },
        body: JSON.stringify({
          model: this.model,
          prompt: promptImmagine(input),
          size: `${input.size}x${input.size}`,
          n: 1,
          // I byte diretti evitano un secondo giro di rete per scaricare
          // l'immagine da un URL temporaneo.
          response_format: "b64_json",
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (errore) {
      if (errore instanceof Error && errore.name === "TimeoutError") {
        throw new AiError("Il modello ci sta mettendo troppo. Riprova.", errore);
      }
      throw new AiError("Non riusciamo a raggiungere il modello.", errore);
    }

    const dati = (await risposta
      .json()
      .catch(() => null)) as RispostaImmagini | null;

    if (!risposta.ok) {
      const dettaglio =
        dati?.error?.message ?? dati?.message ?? `HTTP ${risposta.status}`;
      throw new AiError(`${this.provider} ha risposto con un errore: ${dettaglio}`);
    }

    const primo = dati?.data?.[0];

    if (primo?.b64_json) {
      return {
        data: {
          bytes: Buffer.from(primo.b64_json, "base64"),
          mimeType: "image/png",
        },
        usage: {
          tokensIn: dati?.usage?.input_tokens,
          tokensOut: dati?.usage?.output_tokens,
          images: 1,
        },
        provider: this.provider,
        model: this.model,
      };
    }

    // Alcuni fornitori ignorano response_format e restituiscono comunque un URL.
    if (primo?.url) {
      const file = await fetch(primo.url, {
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!file.ok) {
        throw new AiError("Non siamo riusciti a scaricare l'immagine generata.");
      }
      return {
        data: {
          bytes: Buffer.from(await file.arrayBuffer()),
          mimeType: file.headers.get("content-type") ?? "image/png",
        },
        usage: { images: 1 },
        provider: this.provider,
        model: this.model,
      };
    }

    throw new AiError("Il modello non ha restituito nessuna immagine.");
  }
}
