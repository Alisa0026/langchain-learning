import { ChatDeepSeek } from '@langchain/deepseek'
import 'dotenv/config'
import { tool } from '@langchain/core/tools'
import { z } from 'zod'

const llm = new ChatDeepSeek({
  model: 'deepseek-chat',
  temperature: 0.1,
})

// 定义天气信息的 zod schema
const weatherSchema = z.object({
  location: z.string().describe('城市或地区名称，例如：北京、上海、New York'),
})

// 创建天气工具
// 这是一个模拟的天气工具，实际使用中需要接入真实的天气 API
const weatherTool = tool(
  async ({ location }) => {
    // 模拟天气数据，实际应用中应该调用真实的天气 API
    // 例如：OpenWeatherMap API, WeatherAPI 等
    console.log(`正在获取 ${location} 的天气信息...`)
    
    // 模拟延迟
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 模拟天气数据
    const mockWeatherData = {
      location: location,
      temperature: `${Math.floor(Math.random() * 30 + 10)}°C`,
      condition: ['晴天', '多云', '阴天', '小雨'][Math.floor(Math.random() * 4)],
      humidity: `${Math.floor(Math.random() * 40 + 40)}%`,
      windSpeed: `${Math.floor(Math.random() * 20 + 5)} km/h`,
      timestamp: new Date().toLocaleString('zh-CN')
    }
    
    return JSON.stringify(mockWeatherData, null, 2)
  },
  {
    name: 'get_weather',
    description: '获取指定城市的天气信息。输入城市名称（支持中文和英文），返回温度、天气状况、湿度、风速等信息。',
    schema: weatherSchema,
  }
)

// 绑定工具到 LLM
const llmWithTools = llm.bindTools([weatherTool])

// 获取天气并回答
async function getWeatherAndAnswer(question) {
  try {
    console.log("问题:", question)
    console.log("\n正在调用 LLM...")
    
    // 调用 LLM
    const result = await llmWithTools.invoke(question)
    
    console.log('--- LLM response ---')
    console.log("\nAI 响应:", JSON.stringify(result, null, 2))
    
    // 检查是否有工具调用
    // if (result.tool_calls && result.tool_calls.length > 0) {
    //   console.log(`\n检测到 ${result.tool_calls.length} 个工具调用`)
      
    //   // 执行所有工具调用并收集结果
    //   const toolResults = []
    //   for (const toolCall of result.tool_calls) {
    //     if (toolCall.name === 'get_weather') {
    //       console.log(`执行工具: ${toolCall.name}, 参数:`, toolCall.args)
    //       const toolResult = await weatherTool.invoke(toolCall.args)
    //       toolResults.push({
    //         toolCallId: toolCall.id,
    //         toolCallName: toolCall.name,
    //         args: toolCall.args,
    //         result: toolResult
    //       })
    //       console.log("\n工具执行结果:", toolResult)
    //     }
    //   }
      
    //   // 将结果返回给 LLM，让它基于结果继续回答
    //   if (toolResults.length > 0) {
    //     const messages = [
    //       { role: "user", content: question },
    //       result,
    //       ...toolResults.map(tr => ({
    //         role: "tool",
    //         tool_call_id: tr.toolCallId,
    //         content: tr.result
    //       }))
    //     ]
        
    //     console.log("\n基于天气数据生成最终答案...")
    //     const finalResult = await llm.invoke(messages)
    //     console.log("\n最终答案:", finalResult.content)
        
    //     return finalResult.content
    //   }
    // } else {
    //   console.log("\nLLM 内容:", result.content)
    //   return result.content
    // }
  } catch (error) {
    console.error("执行天气查询时出错:", error.message)
    throw error
  }
}

// 执行示例
const question = "北京现在的天气怎么样？"
getWeatherAndAnswer(question).catch(console.error)

