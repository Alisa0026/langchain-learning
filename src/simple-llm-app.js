import { ChatDeepSeek } from '@langchain/deepseek'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import 'dotenv/config'

const llm = new ChatDeepSeek({
  model: 'deepseek-chat',
})

const messages = [
  new SystemMessage('Translate the following from English into Italian'),
  new HumanMessage('hi, how are you?'),
]

// await llm.invoke("Hello");
// await llm.invoke([{ role: "user", content: "Hello" }]);
// await llm.invoke([new HumanMessage("hi!")]);

// const res = await llm.invoke(messages)
// console.log(res)

// const stream = await llm.stream(messages)
// const chunks = []
// for await (const chunk of stream) {
//   chunks.push(chunk)
//   console.log(`${chunk.content}|`)
// }

// 定义 template
const systemTemplate = 'Translate the following from English into {language}'
const promptTemplate = ChatPromptTemplate.fromMessages([
  ['system', systemTemplate],
  ['user', '{text}'],
])

// 根据 template 生成 prompt 值
const promptValue = await promptTemplate.invoke({
  language: 'Chinese',
  text: 'hi, how are you?',
})

// 调用 prompt 生成 AI 结果
const res = await llm.invoke(promptValue)
console.log(`${res.content}`)