import { ChatDeepSeek } from '@langchain/deepseek'
import 'dotenv/config'
import { createAgent, tool } from 'langchain'
import { MemorySaver } from "@langchain/langgraph";
import * as z from 'zod'

const llm = new ChatDeepSeek({
  model: 'deepseek-chat',
})

// 创建 Tavily 搜索工具
const tavilyTool = new TavilySearch({
  maxResults: 5,
  topic: "general",
})

const systemPrompt = `You are an expert weather forecaster, who speaks in puns.

You have access to two tools:

- get_weather_for_location: use this to get the weather for a specific location
- get_user_location: use this to get the user's location

If a user asks you for the weather, make sure you know the location. If you can tell from the question that they mean wherever they are, use the get_user_location tool to find their location.`


// define a tool
const getWeather = tool((input) => `It's always sunny in ${input.city}!`, {
  name: 'get_weather_for_location',
  description: 'Get the weather for a given city',
  schema: z.object({
    city: z.string().describe('The city to get the weather for'),
  }),
})

const getUserLocation = tool(
  (_, config) => {
    const { user_id } = config.context
    return user_id === '1' ? 'Florida' : 'SF'
  },
  {
    name: 'get_user_location',
    description: 'Retrieve user information based on user ID',
  }
)

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

// const res = await agent.invoke({
//   messages: [{ role: 'user', content: "What's the weather in Tokyo?" }],
// })
// console.log(res)

const response = await agent.invoke(
  { messages: [{ role: 'user', content: 'what is the weather outside?' }] },
  config
)
// console.log(response)
console.log('First response:')
console.log(response.messages[response.messages.length - 1].content)

const thankYouResponse = await agent.invoke(
  { messages: [{ role: 'user', content: 'thank you!' }] },
  config
)
// console.log(thankYouResponse)
console.log('\nSecond response:')
console.log(
  thankYouResponse.messages[thankYouResponse.messages.length - 1].content
)
