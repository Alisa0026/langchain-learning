import { ChatDeepSeek } from '@langchain/deepseek'
import 'dotenv/config'
import { TavilySearch } from "@langchain/tavily";

const llm = new ChatDeepSeek({
  model: 'deepseek-chat',
  temperature: 0.1,
})

// 创建 Tavily 搜索工具
const tavilyTool = new TavilySearch({
  maxResults: 5,
  topic: "general",
})

// 绑定工具到 LLM
const llmWithTools = llm.bindTools([tavilyTool])

// 执行网络搜索并获取答案
async function searchAndAnswer(question) {
  try {
    console.log("问题:", question)
    console.log("\n正在调用 LLM...")
    
    // 调用 LLM
    const result = await llmWithTools.invoke(question)
    
    console.log('--- LLM response ---')
    console.log("\nAI 响应:",result)
  } catch (error) {
    console.error("执行搜索时出错:", error.message)
    throw error
  }
}

// 执行示例
const question = "请搜索并告诉我关于人工智能大语言模型的最新发展趋势"
searchAndAnswer(question).catch(console.error)