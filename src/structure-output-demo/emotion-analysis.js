import { z } from 'zod'
import { ChatDeepSeek } from '@langchain/deepseek'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import dotenv from 'dotenv'

// 加载环境变量
dotenv.config()

// 定义情感分析的 zod schema
const EmotionAnalysisSchema = z.object({
  sentiment: z.enum(["贬义", "褒义", "中性"]).describe("情感倾向"),
  reasoning: z.string().describe("判断依据")
})

// 创建 DeepSeek 模型实例
const llm = new ChatDeepSeek({
  apiKey: process.env.DEEPSEEK_API_KEY,
  model: "deepseek-chat",
  temperature: 0.1,
})

// 定义 prompt template
const systemTemplate = '你是一个专业的情感分析助手。请分析用户输入文本的情感倾向，并给出判断依据。'
const promptTemplate = ChatPromptTemplate.fromMessages([
  ['system', systemTemplate],
  ['user', '请分析以下文本的情感倾向：\n\n{text}\n\n请按照以下格式输出：\n- sentiment: 情感倾向（贬义/褒义/中性）\n- reasoning: 判断依据（详细说明为什么这样判断）'],
])

// 使用 withStructuredOutput 创建结构化输出模型
const llmWithStructuredOutput = llm.withStructuredOutput(EmotionAnalysisSchema)

// 创建完整的链
const chain = promptTemplate.pipe(llmWithStructuredOutput)

// 情感分析函数
async function analyzeEmotion(text) {
  try {
    console.log('正在分析情感倾向...')
    const result = await chain.invoke({ text })
    return result
  } catch (error) {
    console.error('情感分析时出错:', error)
    throw error
  }
}

// 交互式情感分析函数
async function interactiveEmotionAnalysis() {
  const readline = await import('readline')
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  
  console.log('=== 情感分析工具 ===')
  console.log('输入 "exit" 或 "quit" 退出程序')
  console.log('输入 "test" 运行预设测试')
  console.log('----------------------------------------')
  
  const askForInput = () => {
    rl.question('\n请输入要分析的文本: ', async (input) => {
      if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
        console.log('感谢使用情感分析工具！')
        rl.close()
        return
      }
      
      if (input.toLowerCase() === 'test') {
        await runPresetTests()
        askForInput()
        return
      }
      
      if (input.trim() === '') {
        console.log('请输入有效的文本内容！')
        askForInput()
        return
      }
      
      try {
        console.log('\n正在分析中...')
        const result = await analyzeEmotion(input)
        
        console.log('\n=== 分析结果 ===')
        console.log(`情感倾向: ${result.sentiment}`)
        console.log(`判断依据: ${result.reasoning}`)
        console.log('----------------------------------------')
        
      } catch (error) {
        console.error('分析失败:', error.message)
      }
      
      askForInput()
    })
  }
  
  askForInput()
}

// 预设测试函数
async function runPresetTests() {
  const testTexts = [
    "这个产品真的很棒，我非常喜欢！",
    "这个服务太差了，完全不满意。",
    "今天天气不错，温度适宜。",
    "这部电影拍得一般般，没什么特别的。",
    "这家餐厅的食物非常美味，强烈推荐！"
  ]
  
  console.log('\n=== 运行预设测试 ===')
  
  try {
    for (const text of testTexts) {
      console.log(`\n分析文本: "${text}"`)
      const result = await analyzeEmotion(text)
      console.log('分析结果:', JSON.stringify(result, null, 2))
      console.log('---')
    }
  } catch (error) {
    console.error('测试失败:', error.message)
  }
  
  console.log('\n预设测试完成！')
}

// 测试函数（保持向后兼容）
async function testEmotionAnalysis() {
  await runPresetTests()
}

// 导出
export { analyzeEmotion, llmWithStructuredOutput, EmotionAnalysisSchema, chain, interactiveEmotionAnalysis }

// 如果直接运行此文件，则启动交互式模式
if (import.meta.url === `file://${process.argv[1]}`) {
  interactiveEmotionAnalysis()
}
