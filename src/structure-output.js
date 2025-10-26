import { z } from 'zod'
import { ChatDeepSeek } from '@langchain/deepseek'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import dotenv from 'dotenv'

// 加载环境变量
dotenv.config()

// 定义用户信息的 zod schema
const PersonSchema = z.object({
  name: z.string().describe("姓名"),
  age: z.number().int().describe("年龄"),
  gender: z.enum(["男","女","未知","其他"]).describe("性别"),
  skills: z.array(z.string()).describe("技能列表")
})

// 创建 DeepSeek 模型实例
const llm = new ChatDeepSeek({
  apiKey: process.env.DEEPSEEK_API_KEY,
  model: "deepseek-chat",
  temperature: 0.1,
})

// 定义 prompt template
const systemTemplate = '你是一个专业的信息提取助手。请从用户提供的个人介绍中提取以下信息：姓名、年龄、性别、技能列表。'
const promptTemplate = ChatPromptTemplate.fromMessages([
  ['system', systemTemplate],
  ['user', '请从以下个人介绍中提取用户信息：\n\n{personalIntro}\n\n请提取以下信息：\n- name: 姓名\n- age: 年龄（数字）\n- gender: 性别（男/女/未知/其他）\n- skills: 技能列表（数组形式）\n\n如果某些信息无法确定，请合理推断或使用默认值。'],
])

// 使用 withStructuredOutput 创建结构化输出模型
const llmWithStructuredOutput = llm.withStructuredOutput(PersonSchema)

// 创建完整的链
const chain = promptTemplate.pipe(llmWithStructuredOutput)

// 提取用户信息的函数
async function extractPersonInfo(personalIntro) {
  try {
    console.log('正在提取用户信息...')
    const result = await chain.invoke({ personalIntro })
    return result
  } catch (error) {
    console.error('提取用户信息时出错:', error)
    throw error
  }
}

// 测试函数
async function testExtraction() {
  const testIntro = "大家好，我是张三，今年25岁，是一名前端开发工程师。我擅长React、Vue、JavaScript等技术，同时也熟悉Node.js后端开发。"
  
  try {
    const result = await extractPersonInfo(testIntro)
    console.log('提取结果:', JSON.stringify(result, null, 2))
  } catch (error) {
    console.error('测试失败:', error.message)
  }
}

// 导出
export { extractPersonInfo, llmWithStructuredOutput, PersonSchema, chain }

// 如果直接运行此文件，则执行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  testExtraction()
}