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

export const MODELS = {
  OCR: "baidu/qianfan-ocr-fast:free",
  ORCHESTRATOR: "openrouter/owl-alpha",
  TEXTUAL: "google/gemma-4-31b-it:free",
  REROUTING: "openrouter/owl-alpha",
};

export const MODEL_FALLBACKS: Record<string, string> = {
  "google/gemma-4-31b-it:free": "minimax/minimax-m2.5:free",
  "openrouter/owl-alpha": "minimax/minimax-m2.5:free",
};

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
 */
async function callOpenRouter(
  model: string,
  messages: Message[],
  maxTokens: number = 4096,
  retryCount: number = 0
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
        model,
        messages,
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();

      if (response.status === 429 && retryCount === 0) {
        const fallbackModel = MODEL_FALLBACKS[model];
        if (fallbackModel) {
          console.warn(
            `[Agent] Rate limited on ${model}, retrying with fallback ${fallbackModel}`
          );
          return callOpenRouter(
            fallbackModel,
            messages,
            maxTokens,
            retryCount + 1
          );
        }
      }

      throw new Error(
        `OpenRouter API error: ${response.status} - ${errorText}`
      );
    }

    const data = await response.json();

    return {
      content: data.choices[0]?.message?.content || "",
      model,
      usage: data.usage,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(
        `OpenRouter API timeout after ${API_TIMEOUT_MS}ms for model ${model}`
      );
    }
    console.error(`[Agent] Error calling ${model}:`, error);
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
}> {
  try {
    // Step 1: Orchestrating agent analyzes the request
    const orchestration = await orchestratingAgent(
      userQuery || taskType,
      taskType,
      pageContent
    );

    // Step 2: Textual tasks agent executes the main task
    const taskResult = await textualTasksAgent(
      taskType,
      pageContent,
      customInstructions
    );

    // Step 3: Optionally use rerouting agent for post-processing (for complex tasks)
    let finalResult = taskResult.content;

    if (taskType === "Generate Diagram/Infographic description") {
      // Use rerouting agent to refine diagram descriptions
      const refinement = await reroutingAgent(
        taskResult.content,
        "Refine this diagram/infographic description to be more visual and actionable. Include specific visual elements, layout suggestions, and data representation methods."
      );
      finalResult = refinement.content;
    }

    return {
      result: finalResult,
      model: MODELS.TEXTUAL,
      taskType,
    };
  } catch (error) {
    console.error("[Task Execution] Error:", error);
    throw error;
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
