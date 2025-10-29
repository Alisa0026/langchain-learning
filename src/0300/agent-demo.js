import { ChatDeepSeek } from '@langchain/deepseek'
import 'dotenv/config'
import { createAgent } from 'langchain'
import { TavilySearch } from "@langchain/tavily";


const llm = new ChatDeepSeek({
    model: 'deepseek-chat',
})

// 创建 Tavily 搜索工具
const tavilyTool = new TavilySearch({
    maxResults: 5,
    topic: "general",
})

const agent = createAgent({
    model: llm,
    tools: [tavilyTool],
})
const res = await agent.invoke({
    messages: [{ role: 'user', content: "帮我查下一下快排算法如何实现？" }],
})

console.log(res)