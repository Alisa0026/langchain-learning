import { tool } from '@langchain/core/tools'
import * as z from 'zod'
import { ChatDeepSeek } from '@langchain/deepseek'
import 'dotenv/config'
import { task, entrypoint,addMessages, getPreviousState ,MemorySaver} from '@langchain/langgraph'
import { SystemMessage,HumanMessage } from '@langchain/core/messages'
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

const callModel = task({ name: 'callLlm' }, async (messages) => {
    // console.log('callModel',messages);
    
    return modelWithTools.invoke([
        new SystemMessage(
            'You are a helpful assistant tasked with performing arithmetic on a set of inputs.'
        ),
        ...messages,
    ])
})
const callTool = task({ name: 'callTool' }, async (toolCall) => {
    const tool = toolsByName[toolCall.name]
    return tool.invoke(toolCall)
})


const checkpointer = new MemorySaver();
const config = { configurable: { thread_id: uuidv4() } };

const agent = entrypoint({ name: 'agent' ,checkpointer}, async (state,config) => {
    // console.log('state',state);
    // 获取历史对话状态
    const previousState = getPreviousState()
    // console.log('previousState',previousState);

    // 合并历史对话状态和当前对话状态
    let messages = previousState?.messages || []
    messages = addMessages(messages, state.messages)

    // console.log('messages',messages);
    
    // 先调用 llm
    let modelResponse = await callModel(messages)

    // 一个无限循环
    while (true) {
        // 看是否需要 tool call
        if (!modelResponse.tool_calls?.length) {
            // 不需要则退出循环
            break
        }

        // 执行 tool
        const toolResults = await Promise.all(
            modelResponse.tool_calls.map((toolCall) => callTool(toolCall))
        )
        // 将 tool 执行结果再调用 llm
        messages = addMessages(messages, [modelResponse, ...toolResults])
        modelResponse = await callModel(messages)
    }

    // return messages
    return { messages: addMessages(messages, [modelResponse]) }
})

// Invoke
// 第一轮对话
const result = await agent.invoke({ messages: [new HumanMessage('Add 3 and 4.')] },config)

for (const message of result.messages) {
  console.log(`[${message.getType()}]: ${message.text}`)
}

// // 第二轮对话
const result2 = await agent.invoke({ messages: [new HumanMessage('Multiply 5 and 1.')] },config)

for (const message of result2.messages) {
    console.log(`[${message.getType()}]: ${message.text}`)
}
// 第三轮对话
const result3 = await agent.invoke({ messages: [new HumanMessage('我刚才问了什么问题？')] },config)

for (const message of result3.messages) {
    console.log(`[${message.getType()}]: ${message.text}`)
}