import { ChatDeepSeek } from '@langchain/deepseek'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import 'dotenv/config'

const llm = new ChatDeepSeek({
  model: 'deepseek-chat',
})


const systemTemplate = '使用 {language} 回答用户的问题'
const promptTemplate = ChatPromptTemplate.fromMessages([
  ['system', systemTemplate],
  ['user', '{text}'],
])

const promptValue = await promptTemplate.invoke({
  language: '中文',
  text: 'Why does the sun rise in the east?',
})

const stream = await llm.stream(promptValue)

// 流式输出结果
for await (const chunk of stream) {
//   console.log(`${chunk.content}|`)
  process.stdout.write(chunk.content)
}