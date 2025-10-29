import { ChatDeepSeek } from '@langchain/deepseek'
import 'dotenv/config'
import { createAgent, tool } from 'langchain'
import * as z from 'zod'

const llm = new ChatDeepSeek({
  model: 'deepseek-chat',
})

// define a tool
const getWeather = tool((input) => `It's always sunny in ${input.city}!`, {
  name: 'get_weather',
  description: 'Get the weather for a given city',
  schema: z.object({
    city: z.string().describe('The city to get the weather for'),
  }),
})

const agent = createAgent({
  model: llm,
  tools: [getWeather],
})

const res = await agent.invoke({
  messages: [{ role: 'user', content: "What's the weather in Tokyo?" }],
})

console.log(res)
