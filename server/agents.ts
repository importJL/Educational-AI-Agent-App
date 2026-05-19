/**
 * Multi-agent orchestration system using OpenRouter models.
 *
 * Agents:
 * - OCR Agent: baidu/qianfan-ocr-fast:free - Extracts text from PDF images
 * - Orchestrating Agent: openrouter/owl-alpha - Understands user query and delegates tasks
 * - Textual Tasks Agent: google/gemma-4-31b-it:free - Handles summarization, extraction, analysis
 * - Rerouting Agent: openrouter/owl-alpha - Intermediary functions and context processing
 */

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const API_TIMEOUT_MS = 60_000;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // Base delay for exponential backoff

export const MODELS = {
  OCR: "baidu/qianfan-ocr-fast:free",
  ORCHESTRATOR: "openrouter/owl-alpha",
  TEXTUAL: "google/gemma-4-31b-it:free",
  REROUTING: "openrouter/owl-alpha",
};

export const MODEL_FALLBACKS: Record<string, string> = {
  "google/gemma-4-31b-it:free": "deepseek/deepseek-v4-flash:free",
  "openrouter/owl-alpha": "minimax/minimax-m2.5:free",
};

// Track which model variant we're currently using to prevent fallback loops
interface RequestContext {
  originalModel: string;
  currentModel: string;
  retryCount: number;
}

function getFallbackModel(
  model: string,
  status: number,
  errorText: string,
  originalModel: string,
  retryCount: number
): string | null {
  // For rate limits (429), allow retries on the same model up to MAX_RETRIES
  if (status === 429 && retryCount < MAX_RETRIES) {
    return model; // Retry the same model with backoff
  }

  // Only fallback once per original model
  if (originalModel !== model) return null;

  const fallbackModel = MODEL_FALLBACKS[model];
  if (!fallbackModel) return null;

  if (status === 400 && /location|not supported|region/i.test(errorText)) {
    return fallbackModel;
  }

  if (status === 429) {
    return fallbackModel;
  }

  if (status === 503) {
    return fallbackModel;
  }

  if (status === 402) {
    return fallbackModel;
  }

  return null;
}

/**
 * Calculate exponential backoff delay
 * Prevents overwhelming the API with retries
 */
function getBackoffDelay(retryCount: number): number {
  return RETRY_DELAY_MS * Math.pow(2, retryCount);

}

/**
 * Sleep utility for delays between retries
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getErrorReason(status: number, errorText: string): string {
  if (status === 400 && /location|not supported|region/i.test(errorText)) {
    return "Region/location not supported";
  }
  if (status === 429) return "Rate limited";
  if (status === 503) return "Provider unavailable";
  if (status === 402) return "Quota exceeded";
  return `HTTP error ${status}`;
}

export type TaskType =
  | "Summarize"
  | "Extract Key Points"
  | "Generate Diagram/Infographic description"
  | "Custom Instructions";

interface AgentResponse {
  content: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

/**
 * Call OpenRouter API with specified model
 * Supports retries for rate limits and fallback models for other errors
 */
async function callOpenRouter(
  model: string,
  messages: Message[],
  maxTokens: number = 4096,
  context: RequestContext = { originalModel: model, currentModel: model, retryCount: 0 }
): Promise<AgentResponse> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY environment variable not set");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://manus.space",
        "X-Title": "Educational AI Agent",
      },
      body: JSON.stringify({
        model: context.currentModel,
        messages,
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      const errorReason = getErrorReason(response.status, errorText);

      // Handle rate limiting with exponential backoff retry
      if (response.status === 429 && context.retryCount < MAX_RETRIES) {
        const backoffMs = getBackoffDelay(context.retryCount);
        console.warn(
          `[Agent] ${errorReason} on ${context.currentModel} (attempt ${context.retryCount + 1}/${MAX_RETRIES}), retrying in ${backoffMs}ms...`
        );
        await sleep(backoffMs);
        return callOpenRouter(context.currentModel, messages, maxTokens, {
          originalModel: context.originalModel,
          currentModel: context.currentModel,
          retryCount: context.retryCount + 1,
        });
      }

      // Try fallback model for non-rate-limit errors or after max retries exhausted
      const fallbackModel = getFallbackModel(
        model,
        response.status,
        errorText,
        context.originalModel,
        context.retryCount
      );

      if (fallbackModel && fallbackModel !== context.currentModel) {
        console.warn(
          `[Agent] ${errorReason} on ${context.currentModel}, switching to fallback model ${fallbackModel}`
        );
        return callOpenRouter(fallbackModel, messages, maxTokens, {
          originalModel: context.originalModel,
          currentModel: fallbackModel,
          retryCount: 0, // Reset retry count for new model
        });
      }

      throw new Error(
        `OpenRouter API error: ${response.status} - ${errorText}`
      );
    }

    const data = await response.json();

    if (context.retryCount > 0) {
      console.info(
        `[Agent] Request succeeded on ${context.currentModel} after ${context.retryCount} retries`
      );
    }

    return {
      content: data.choices[0]?.message?.content || "",
      model: context.currentModel,
      usage: data.usage,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(
        `OpenRouter API timeout after ${API_TIMEOUT_MS}ms for model ${context.currentModel}`
      );
    }
    console.error(`[Agent] Error calling ${context.currentModel}:`, error);
    throw error;
  }
}

/**
 * OCR Agent: Extract text from PDF page content
 */
export async function ocrAgent(pageContent: string): Promise<AgentResponse> {
  const messages: Message[] = [
    {
      role: "system",
      content:
        "You are an OCR specialist. Extract and clean text from the provided PDF page content. Preserve structure and formatting as much as possible.",
    },
    {
      role: "user",
      content: `Please extract and clean the text from this PDF page:\n\n${pageContent}`,
    },
  ];

  return callOpenRouter(MODELS.OCR, messages);
}

/**
 * Orchestrating Agent: Understand user query and delegate to appropriate agent
 */
export async function orchestratingAgent(
  userQuery: string,
  taskType: TaskType,
  pageContent: string
): Promise<AgentResponse> {
  const messages: Message[] = [
    {
      role: "system",
      content: `You are an orchestrating agent that understands user queries and delegates tasks appropriately.
      
Task type: ${taskType}
Available task types: Summarize, Extract Key Points, Generate Diagram/Infographic description, Custom Instructions

Analyze the user's request and the provided page content. Determine the best approach and provide clear instructions for the next agent.`,
    },
    {
      role: "user",
      content: `User query: ${userQuery}\n\nPage content:\n${pageContent}`,
    },
  ];

  return callOpenRouter(MODELS.ORCHESTRATOR, messages);
}

/**
 * Textual Tasks Agent: Handle summarization, extraction, and analysis
 */
export async function textualTasksAgent(
  taskType: TaskType,
  pageContent: string,
  customInstructions?: string
): Promise<AgentResponse> {
  let systemPrompt = `You are an expert text analyst. Your task is to ${taskType.toLowerCase()} the provided content.`;

  if (taskType === "Summarize") {
    systemPrompt +=
      " Provide a concise, well-structured summary that captures the key ideas and important details.";
  } else if (taskType === "Extract Key Points") {
    systemPrompt +=
      " Extract and list the most important points, insights, and takeaways from the content.";
  } else if (taskType === "Generate Diagram/Infographic description") {
    systemPrompt +=
      " Analyze the content and describe how it could be visualized as a diagram or infographic. Provide a detailed description of the structure, relationships, and visual elements.";
  } else if (taskType === "Custom Instructions") {
    systemPrompt += ` Follow these custom instructions: ${customInstructions}`;
  }

  systemPrompt +=
    "\n\nFormat your response in clear, readable markdown with proper structure.";

  const messages: Message[] = [
    {
      role: "system",
      content: systemPrompt,
    },
    {
      role: "user",
      content: `Please analyze this content:\n\n${pageContent}`,
    },
  ];

  return callOpenRouter(MODELS.TEXTUAL, messages);
}

/**
 * Rerouting Agent: Handle intermediary functions and context processing
 */
export async function reroutingAgent(
  context: string,
  instruction: string
): Promise<AgentResponse> {
  const messages: Message[] = [
    {
      role: "system",
      content:
        "You are an intermediary agent that processes context and applies transformations. Provide clear, structured output.",
    },
    {
      role: "user",
      content: `Context:\n${context}\n\nInstruction:\n${instruction}`,
    },
  ];

  return callOpenRouter(MODELS.REROUTING, messages);
}

/**
 * Execute a complete task workflow with agent orchestration
 */
export async function executeTask(
  taskType: TaskType,
  pageContent: string,
  userQuery?: string,
  customInstructions?: string
): Promise<{
  result: string;
  model: string;
  taskType: TaskType;
  logs: Array<{
    agent: string;
    model: string;
    messages: Message[];
    responsePreview?: string;
  }>;
}> {
  try {
    const logs: Array<{
      agent: string;
      model: string;
      messages: Message[];
      responsePreview?: string;
    }> = [];

    // Step 1: Orchestrating agent analyzes the request
    const orchestrationMessages: Message[] = [
      {
        role: "system",
        content: `You are an orchestrating agent that understands user queries and delegates tasks appropriately.\n      \nTask type: ${taskType}\nAvailable task types: Summarize, Extract Key Points, Generate Diagram/Infographic description, Custom Instructions\n\nAnalyze the user's request and the provided page content. Determine the best approach and provide clear instructions for the next agent.`,
      },
      {
        role: "user",
        content: `User query: ${userQuery || taskType}\n\nPage content:\n${pageContent}`,
      },
    ];

    console.info("[AgentFlow] Calling Orchestrator with messages:", orchestrationMessages);
    const orchestration = await callOpenRouter(MODELS.ORCHESTRATOR, orchestrationMessages);
    console.info(`[AgentFlow] Orchestrator response (model ${orchestration.model}):`, orchestration.content);
    logs.push({ agent: "orchestrator", model: orchestration.model, messages: orchestrationMessages, responsePreview: orchestration.content.slice(0, 400) });

    // Step 2: Textual tasks agent executes the main task
    const textualSystemPromptBase = `You are an expert text analyst. Your task is to ${taskType.toLowerCase()} the provided content.`;
    let textualSystemPrompt = textualSystemPromptBase;
    if (taskType === "Summarize") {
      textualSystemPrompt +=
        " Provide a concise, well-structured summary that captures the key ideas and important details.";
    } else if (taskType === "Extract Key Points") {
      textualSystemPrompt +=
        " Extract and list the most important points, insights, and takeaways from the content.";
    } else if (taskType === "Generate Diagram/Infographic description") {
      textualSystemPrompt +=
        " Analyze the content and describe how it could be visualized as a diagram or infographic. Provide a detailed description of the structure, relationships, and visual elements.";
    } else if (taskType === "Custom Instructions") {
      textualSystemPrompt += ` Follow these custom instructions: ${customInstructions}`;
    }
    textualSystemPrompt += "\n\nFormat your response in clear, readable markdown with proper structure.";

    const textualMessages: Message[] = [
      { role: "system", content: textualSystemPrompt },
      { role: "user", content: `Please analyze this content:\n\n${pageContent}` },
    ];

    console.info("[AgentFlow] Calling TextualTasks agent with messages:", textualMessages);
    const taskResult = await callOpenRouter(MODELS.TEXTUAL, textualMessages);
    console.info(`[AgentFlow] TextualTasks response (model ${taskResult.model}):`, taskResult.content);
    logs.push({ agent: "textual", model: taskResult.model, messages: textualMessages, responsePreview: taskResult.content.slice(0, 400) });

    // Step 3: Optionally use rerouting agent for post-processing (for complex tasks)
    let finalResult = taskResult.content;

    if (taskType === "Generate Diagram/Infographic description") {
      const reroutingMessages: Message[] = [
        { role: "system", content: "You are an intermediary agent that processes context and applies transformations. Provide clear, structured output." },
        { role: "user", content: `Context:\n${taskResult.content}\n\nInstruction:\nRefine this diagram/infographic description to be more visual and actionable. Include specific visual elements, layout suggestions, and data representation methods.` },
      ];

      console.info("[AgentFlow] Calling Rerouting agent with messages:", reroutingMessages);
      const refinement = await callOpenRouter(MODELS.REROUTING, reroutingMessages);
      console.info(`[AgentFlow] Rerouting response (model ${refinement.model}):`, refinement.content);
      logs.push({ agent: "rerouting", model: refinement.model, messages: reroutingMessages, responsePreview: refinement.content.slice(0, 400) });

      finalResult = refinement.content;
    }

    return {
      result: finalResult,
      model: MODELS.TEXTUAL,
      taskType,
      logs,
    };
  } catch (error) {
    console.error("[Task Execution] Error:", error);
    throw error;
  }
}

/**
 * Execute task and stream incremental agent logs via an emit callback.
 * emit(obj) will be called with objects { type: 'log'|'final'|'error', payload: any }
 */
export async function executeTaskStream(
  taskType: TaskType,
  pageContent: string,
  emit: (obj: { type: string; payload: any }) => Promise<void>,
  userQuery?: string,
  customInstructions?: string
): Promise<void> {
  try {
    // Orchestrator
    const orchestrationMessages: Message[] = [
      {
        role: "system",
        content: `You are an orchestrating agent that understands user queries and delegates tasks appropriately.\n\nTask type: ${taskType}`,
      },
      {
        role: "user",
        content: `User query: ${userQuery || taskType}\n\nPage content:\n${pageContent}`,
      },
    ];

    console.info("[AgentStream] Calling Orchestrator");
    const orchestration = await callOpenRouter(MODELS.ORCHESTRATOR, orchestrationMessages);
    await emit({ type: "log", payload: { agent: "orchestrator", model: orchestration.model, messages: orchestrationMessages, responsePreview: orchestration.content.slice(0, 400) } });

    // Textual task
    let textualSystemPrompt = `You are an expert text analyst. Your task is to ${taskType.toLowerCase()} the provided content.`;
    if (taskType === "Summarize") {
      textualSystemPrompt += " Provide a concise, well-structured summary that captures the key ideas and important details.";
    } else if (taskType === "Extract Key Points") {
      textualSystemPrompt += " Extract and list the most important points, insights, and takeaways from the content.";
    } else if (taskType === "Generate Diagram/Infographic description") {
      textualSystemPrompt += " Analyze the content and describe how it could be visualized as a diagram or infographic.";
    } else if (taskType === "Custom Instructions") {
      textualSystemPrompt += ` Follow these custom instructions: ${customInstructions}`;
    }
    textualSystemPrompt += "\n\nFormat your response in clear, readable markdown with proper structure.";

    const textualMessages: Message[] = [
      { role: "system", content: textualSystemPrompt },
      { role: "user", content: `Please analyze this content:\n\n${pageContent}` },
    ];

    console.info("[AgentStream] Calling TextualTasks");
    const taskResult = await callOpenRouter(MODELS.TEXTUAL, textualMessages);
    await emit({ type: "log", payload: { agent: "textual", model: taskResult.model, messages: textualMessages, responsePreview: taskResult.content.slice(0, 400) } });

    let finalResult = taskResult.content;

    if (taskType === "Generate Diagram/Infographic description") {
      const reroutingMessages: Message[] = [
        { role: "system", content: "You are an intermediary agent that processes context and applies transformations. Provide clear, structured output." },
        { role: "user", content: `Context:\n${taskResult.content}\n\nInstruction:\nRefine this diagram/infographic description to be more visual and actionable.` },
      ];
      console.info("[AgentStream] Calling Rerouting");
      const refinement = await callOpenRouter(MODELS.REROUTING, reroutingMessages);
      await emit({ type: "log", payload: { agent: "rerouting", model: refinement.model, messages: reroutingMessages, responsePreview: refinement.content.slice(0, 400) } });
      finalResult = refinement.content;
    }

    await emit({ type: "final", payload: { result: finalResult, model: MODELS.TEXTUAL, taskType } });
  } catch (error) {
    console.error("[AgentStream] Error:", error);
    await emit({ type: "error", payload: { message: (error as Error).message || String(error) } });
  }
}

/**
 * Test OpenRouter API connection
 */
export async function testOpenRouterConnection(): Promise<boolean> {
  try {
    const response = await callOpenRouter(
      MODELS.TEXTUAL,
      [
        {
          role: "user",
          content:
            "Say 'OpenRouter API connection successful' if you can read this.",
        },
      ],
      100
    );

    return response.content.length > 0;
  } catch (error) {
    console.error("[OpenRouter] Connection test failed:", error);
    return false;
  }
}
