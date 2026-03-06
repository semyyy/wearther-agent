/**
 * Multi-LLM provider support.
 *
 * Supports: Gemini (default) and OpenAI.
 * Provider is selected via LLM_PROVIDER env var.
 */

import { BaseLlm, getLogger } from "@google/adk";
import type { LlmRequest } from "@google/adk";
import type { LlmResponse } from "@google/adk";
import type { BaseLlmConnection } from "@google/adk";
import type { Content, Part } from "@google/genai";
import OpenAI from "openai";

const logger = getLogger();

// ─── Types ───────────────────────────────────────────────────────────────────

type Provider = "gemini" | "openai";

interface OpenAiMessage {
    role: "system" | "user" | "assistant" | "tool";
    content?: string | null;
    tool_calls?: OpenAI.Chat.ChatCompletionMessageToolCall[];
    tool_call_id?: string;
}

// ─── Conversion helpers: Google Content ↔ OpenAI Messages ────────────────────

function googleContentToOpenAiMessages(
    contents: Content[],
    toolCallIdMap?: Map<string, string>
): OpenAiMessage[] {
    const messages: OpenAiMessage[] = [];

    for (const content of contents) {
        const role = content.role === "model" ? "assistant" : content.role === "user" ? "user" : "user";
        const parts = content.parts ?? [];

        // Check for function call parts (model → tool_calls in OpenAI)
        const functionCalls = parts.filter((p: Part) => p.functionCall);
        const functionResponses = parts.filter((p: Part) => p.functionResponse);
        const textParts = parts.filter((p: Part) => p.text !== undefined);

        if (functionResponses.length > 0) {
            // Function responses → tool messages
            for (const fr of functionResponses) {
                const fnName = fr.functionResponse!.name ?? "unknown";
                // Use the stored tool_call_id if available, fallback to function name
                const toolCallId = toolCallIdMap?.get(fnName) ?? fnName;
                messages.push({
                    role: "tool",
                    content: JSON.stringify(fr.functionResponse!.response),
                    tool_call_id: toolCallId,
                });
            }
        } else if (functionCalls.length > 0) {
            // Function calls from model → assistant with tool_calls
            const toolCalls: OpenAI.Chat.ChatCompletionMessageToolCall[] = functionCalls.map((fc: Part, i: number) => {
                const fnName = fc.functionCall!.name ?? "";
                return {
                    id: toolCallIdMap?.get(fnName) ?? `call_${fnName || i}`,
                    type: "function" as const,
                    function: {
                        name: fnName,
                        arguments: JSON.stringify(fc.functionCall!.args ?? {}),
                    },
                };
            });
            const textContent = textParts.map((p: Part) => p.text).join("");
            messages.push({
                role: "assistant",
                content: textContent || null,
                tool_calls: toolCalls,
            });
        } else {
            // Plain text
            const text = textParts.map((p: Part) => p.text).join("");
            if (text) {
                messages.push({ role, content: text });
            }
        }
    }

    return messages;
}

/** Extracts tool_call IDs from an OpenAI response for later matching */
function extractToolCallIds(
    choice: OpenAI.Chat.ChatCompletion.Choice
): Map<string, string> {
    const map = new Map<string, string>();
    const toolCalls = choice.message.tool_calls;
    if (toolCalls) {
        for (const tc of toolCalls) {
            const fn = (tc as any).function;
            if (fn?.name && tc.id) {
                map.set(fn.name, tc.id);
            }
        }
    }
    return map;
}

/**
 * Recursively normalizes a Google-Genai JSON Schema so it is compatible with
 * standard OpenAI tool-calling:
 *   - type names are lowercased ("STRING" → "string", "OBJECT" → "object", …)
 *   - minLength / maxLength are converted back to numbers (ADK stringifies them)
 */
function normalizeSchema(obj: unknown): unknown {
    if (Array.isArray(obj)) return obj.map(normalizeSchema);
    if (obj === null || typeof obj !== "object") return obj;

    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
        if (key === "type" && typeof value === "string") {
            out[key] = value.toLowerCase();
        } else if (
            (key === "minLength" || key === "maxLength" ||
                key === "minItems" || key === "maxItems") &&
            typeof value === "string"
        ) {
            out[key] = Number(value);
        } else {
            out[key] = normalizeSchema(value);
        }
    }
    return out;
}

function googleToolsToOpenAiFunctions(
    config?: LlmRequest["config"]
): OpenAI.Chat.ChatCompletionTool[] | undefined {
    const tools = config?.tools;
    if (!tools || !Array.isArray(tools)) return undefined;

    const result: OpenAI.Chat.ChatCompletionTool[] = [];

    for (const tool of tools) {
        // Each Google tool has functionDeclarations
        const decls = (tool as any).functionDeclarations;
        if (!decls || !Array.isArray(decls)) continue;

        for (const decl of decls) {
            result.push({
                type: "function",
                function: {
                    name: decl.name,
                    description: decl.description ?? "",
                    parameters: normalizeSchema(decl.parameters) as any,
                },
            });
        }
    }

    return result.length > 0 ? result : undefined;
}



function openAiResponseToGoogleContent(
    choice: OpenAI.Chat.ChatCompletion.Choice
): Content {
    const msg = choice.message;
    const parts: Part[] = [];

    // Tool calls → functionCall parts (proper format)
    if (msg.tool_calls && msg.tool_calls.length > 0) {
        // Include any text content alongside tool calls
        if (msg.content) {
            parts.push({ text: msg.content });
        }
        for (const tc of msg.tool_calls) {
            // Cast to access .function (OpenAI SDK uses a union type)
            const fn = (tc as any).function;
            if (!fn) continue;
            let args: Record<string, unknown> = {};
            try {
                args = JSON.parse(fn.arguments);
            } catch {
                args = {};
            }
            parts.push({
                functionCall: {
                    name: fn.name,
                    args,
                },
            });
        }
    } else if (msg.content) {
        parts.push({ text: msg.content });
    }

    // Fallback if no parts
    if (parts.length === 0) {
        parts.push({ text: "" });
    }

    return { role: "model", parts };
}

// ─── OpenAI-compatible LLM ───────────────────────────────────────────────────

class OpenAiCompatibleLlm extends BaseLlm {
    private client: OpenAI;
    private providerName: string;
    /** Maps function name → tool_call_id from the provider's last response */
    private toolCallIdMap = new Map<string, string>();

    constructor(opts: {
        model: string;
        apiKey: string;
        baseURL?: string;
        providerName: string;
    }) {
        super({ model: opts.model });
        this.providerName = opts.providerName;
        this.client = new OpenAI({
            apiKey: opts.apiKey,
            baseURL: opts.baseURL,
        });
    }

    async *generateContentAsync(
        llmRequest: LlmRequest,
        _stream?: boolean
    ): AsyncGenerator<LlmResponse, void> {
        try {
            // Build the messages array
            const messages: OpenAiMessage[] = [];

            // System instruction
            const systemInstruction = llmRequest.config?.systemInstruction;
            if (systemInstruction) {
                let sysText = "";
                if (typeof systemInstruction === "string") {
                    sysText = systemInstruction;
                } else if (
                    typeof systemInstruction === "object" &&
                    "parts" in systemInstruction
                ) {
                    sysText = (systemInstruction as Content).parts
                        ?.map((p: Part) => p.text ?? "")
                        .join("") ?? "";
                }
                if (sysText) {
                    messages.push({ role: "system", content: sysText });
                }
            }

            // Conversation contents (pass toolCallIdMap so function responses get correct IDs)
            messages.push(
                ...googleContentToOpenAiMessages(llmRequest.contents, this.toolCallIdMap)
            );

            // Tools
            const tools = googleToolsToOpenAiFunctions(llmRequest.config);

            logger.info(
                `[${this.providerName}] Sending ${messages.length} messages, ${tools?.length ?? 0} tools`
            );

            const temperature = llmRequest.config?.temperature ?? undefined;

            const response = await this.client.chat.completions.create({
                model: this.model,
                messages: messages as any,
                tools: tools,
                temperature,
            });

            const choice = response.choices[0];
            if (!choice) {
                yield {
                    errorCode: "NO_CHOICE",
                    errorMessage: `${this.providerName} returned no choices`,
                };
                return;
            }

            const content = openAiResponseToGoogleContent(choice);

            // Store the tool_call IDs for the next round (if any).
            this.toolCallIdMap = extractToolCallIds(choice);

            // Check if the response contains function calls (either proper or extracted from text)
            const hasFunctionCalls = content.parts?.some(
                (p: Part) => p.functionCall
            ) ?? false;

            yield {
                content,
                turnComplete: !hasFunctionCalls,
            };
        } catch (err: any) {
            logger.error(`[${this.providerName}] Error: ${err.message}`);
            yield {
                errorCode: "PROVIDER_ERROR",
                errorMessage: `${this.providerName}: ${err.message}`,
            };
        }
    }

    async connect(_llmRequest: LlmRequest): Promise<BaseLlmConnection> {
        throw new Error(
            `Live/streaming connection is not supported for ${this.providerName}. ` +
            `Use Gemini for live features.`
        );
    }
}

// ─── Factory ─────────────────────────────────────────────────────────────────

/**
 * Returns the model configuration based on LLM_PROVIDER env var.
 *
 * - "gemini" → returns a model name string (ADK handles it natively)
 * - "openai" → returns an OpenAiCompatibleLlm with OpenAI API
 */
export function getModel(): string | BaseLlm {
    const provider = (process.env.LLM_PROVIDER ?? "gemini").toLowerCase() as Provider;

    switch (provider) {
        case "openai": {
            const apiKey = process.env.OPENAI_API_KEY;
            if (!apiKey) {
                throw new Error(
                    "OPENAI_API_KEY is required when LLM_PROVIDER=openai. Add it to your .env file."
                );
            }
            const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
            logger.info(`[llm-provider] Using OpenAI provider, model=${model}`);
            return new OpenAiCompatibleLlm({
                model,
                apiKey,
                providerName: "OpenAI",
            });
        }

        case "gemini":
        default: {
            const model = process.env.GEMINI_MODEL ?? process.env.MODEL ?? "gemini-2.5-flash";
            logger.info(`[llm-provider] Using Gemini provider, model=${model}`);
            return model; // ADK handles Gemini natively with a string
        }
    }
}

/**
 * Returns a human-readable description of the current provider config.
 */
export function getProviderInfo(): string {
    const provider = (process.env.LLM_PROVIDER ?? "gemini").toLowerCase();
    switch (provider) {
        case "openai":
            return `OpenAI/${process.env.OPENAI_MODEL ?? "gpt-4o-mini"}`;
        default:
            return `Gemini/${process.env.GEMINI_MODEL ?? process.env.MODEL ?? "gemini-2.5-flash"}`;
    }
}
