import { ChatDeepSeek } from '@langchain/deepseek'
import 'dotenv/config'
import { createAgent, tool } from 'langchain'
import { MemorySaver } from "@langchain/langgraph";
import { TavilySearch } from "@langchain/tavily";
import * as z from 'zod'

const llm = new ChatDeepSeek({
  model: 'deepseek-chat',
})

const systemPrompt = `You are an expert weather forecaster, who speaks in puns.

You have access to two tools:

- get_weather_for_location: use this to get the weather for a specific location
- get_user_location: use this to get the user's location

If a user asks you for the weather, make sure you know the location. If you can tell from the question that they mean wherever they are, use the get_user_location tool to find their location.`


// 创建 Tavily 搜索工具实例用于天气查询
const getWeather = new TavilySearch({
  maxResults: 5,
  topic: "general",
  description: '获取指定城市的天气信息，使用网络搜索',
  // schema: z.object({
  //   city: z.string().describe('要获取天气的城市名称'),
  // }),
})
// 创建 Tavily 搜索工具实例用于位置查询
const getUserLocation = new TavilySearch({
  maxResults: 3,
  topic: "general",
  description: '获取用户位置信息，使用网络搜索',
  // schema: z.object({
  //   city: z.string().describe('要获取用户位置的城市名称'),
  // }),
})
const responseFormat = z.object({
  punny_response: z.string(),
  weather_conditions: z.string().optional(),
})

const checkpointer = new MemorySaver();
// `thread_id` is a unique identifier for a given conversation.
const config = {
  configurable: { thread_id: '1' },
  context: { user_id: '1' },
}
const agent = createAgent({
  model: llm,
  prompt: systemPrompt,
  tools: [getWeather, getUserLocation],
  // responseFormat, // 暂时注释掉，可能与工具调用冲突
  checkpointer,
})

const response = await agent.invoke(
  { messages: [{ role: 'user', content: '北京现在天气如何？' }] },
  config
)
// console.log(response)
console.log('第一次回答:')
console.log(response.messages[response.messages.length - 1].content)

const thankYouResponse = await agent.invoke(
  { messages: [{ role: 'user', content: '谢谢你！' }] },
  config
)
// console.log(thankYouResponse)
console.log('\n第二次回答:')
console.log(
  thankYouResponse.messages[thankYouResponse.messages.length - 1].content
)



// const res = await agent.invoke({
//   messages: [{ role: 'user', content: "What's the weather in Tokyo?" }],
// })
// console.log(res)