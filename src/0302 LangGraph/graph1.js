import { tool } from '@langchain/core/tools'
import * as z from 'zod'
import { ChatDeepSeek } from '@langchain/deepseek'
import 'dotenv/config'
import { MessagesZodMeta } from "@langchain/langgraph";
import { registry } from "@langchain/langgraph/zod";
import { SystemMessage } from '@langchain/core/messages'
import { isAIMessage } from '@langchain/core/messages'
import { StateGraph, START, END } from '@langchain/langgraph'
import { HumanMessage } from '@langchain/core/messages'
import { MemorySaver } from "@langchain/langgraph";
import { v4 as uuidv4 } from "uuid";

const llm = new ChatDeepSeek({
  model: 'deepseek-chat',
})

// Define tools
const add = tool(({ a, b }) => a + b, {
  name: 'add',
  description: 'Add two numbers',
  schema: z.object({
    a: z.number().describe('First number'),
    b: z.number().describe('Second number'),
  }),
})

const multiply = tool(({ a, b }) => a * b, {
  name: 'multiply',
  description: 'Multiply two numbers',
  schema: z.object({
    a: z.number().describe('First number'),
    b: z.number().describe('Second number'),
  }),
})

const divide = tool(({ a, b }) => a / b, {
  name: 'divide',
  description: 'Divide two numbers',
  schema: z.object({
    a: z.number().describe('First number'),
    b: z.number().describe('Second number'),
  }),
})

// Augment the LLM with tools
const toolsByName = {
  [add.name]: add,
  [multiply.name]: multiply,
  [divide.name]: divide,
}
const tools = Object.values(toolsByName)
const modelWithTools = llm.bindTools(tools)

const MessagesState = z.object({
  messages: z
    .array(z.custom())
    .register(registry, MessagesZodMeta),
  llmCalls: z.number().optional(),
});

async function llmCall(state) {
  const newMessages = await modelWithTools.invoke([
    new SystemMessage(
      'You are a helpful assistant tasked with performing arithmetic on a set of inputs.'
    ),
    ...state.messages,
  ])

  const newLlmCalls = (state.llmCalls ?? 0) + 1
  return {
    messages: newMessages,
    llmCalls: newLlmCalls,
  }
}

async function toolNode(state) {
  const lastMessage = state.messages.at(-1)

  if (lastMessage == null || !isAIMessage(lastMessage)) {
    return { messages: [] }
  }

  const result = []
  for (const toolCall of lastMessage.tool_calls ?? []) {
    const tool = toolsByName[toolCall.name]
    const observation = await tool.invoke(toolCall)
    result.push(observation)
  }

  return { messages: result }
}

async function shouldContinue(state) {
  const lastMessage = state.messages.at(-1)
  if (lastMessage == null || !isAIMessage(lastMessage)) return END

  // If the LLM makes a tool call, then perform an action
  if (lastMessage.tool_calls?.length) {
    return 'toolNode'
  }

  // Otherwise, we stop (reply to the user)
  return END
}

const graph = new StateGraph(MessagesState)
  .addNode('llmCall', llmCall)
  .addNode('toolNode', toolNode)
  .addEdge(START, 'llmCall')
  .addConditionalEdges('llmCall', shouldContinue, ['toolNode', END])
  .addEdge('toolNode', 'llmCall')


const checkpointer = new MemorySaver();
const config = { configurable: { thread_id: uuidv4() } };
const agent = graph.compile({ checkpointer })

// Invoke
// 第一轮对话
const result = await agent.invoke({
  messages: [new HumanMessage('Add 3 and 4.')],
},config)

for (const message of result.messages) {
  console.log(`[${message.getType()}]: ${message.text}`)
}

// 第二轮对话
const result2 = await agent.invoke({
  messages: [new HumanMessage('Multiply 5 and 1.')],
},config)

for (const message of result2.messages) {
  console.log(`[${message.getType()}]: ${message.text}`)
}
// 第三轮对话
const result3 = await agent.invoke({
  messages: [new HumanMessage('我刚才问了什么问题？')],
},config)

for (const message of result3.messages) {
  console.log(`[${message.getType()}]: ${message.text}`)
}