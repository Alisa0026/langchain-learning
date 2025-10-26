import { ChatDeepSeek } from '@langchain/deepseek'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { RunnableLambda } from '@langchain/core/runnables'
import 'dotenv/config'

const llm = new ChatDeepSeek({
    model: 'deepseek-chat',
})

const prompt = ChatPromptTemplate.fromTemplate('讲一个关于{topic}的笑话')

const chain = prompt.pipe(llm).pipe(new StringOutputParser())

// const res = await chain.invoke({ topic: '狗熊' })
// console.log(res)

// const stream = await chain.stream({
//     topic: '狗熊',
// })

// for await (const chunk of stream) {
//     console.log(`${chunk}|`)
// }


const analysisPrompt =
  ChatPromptTemplate.fromTemplate('这个笑话搞笑吗？ {joke}')

const composedChain = new RunnableLambda({
  func: async (input) => {
    const result = await chain.invoke(input)
    return { joke: result }
  },
})
  .pipe(analysisPrompt)
  .pipe(llm)
  .pipe(new StringOutputParser())

const res2 = await composedChain.invoke({ topic: '狗熊' })
console.log(res2)