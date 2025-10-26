import { ChatDeepSeek } from '@langchain/deepseek'
import 'dotenv/config'
import { PromptTemplate } from '@langchain/core/prompts'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { RunnableMap } from '@langchain/core/runnables'


const llm = new ChatDeepSeek({
  model: 'deepseek-chat',
})


// const jokeChain = PromptTemplate.fromTemplate('讲一个关于 {topic} 的笑话')
//   .pipe(llm)
//   .pipe(new StringOutputParser())

// const introChain = PromptTemplate.fromTemplate(
//   '介绍 {topic} 的基础知识，50字以内'
// )
//   .pipe(llm)
//   .pipe(new StringOutputParser())
  
//   const mapChain = RunnableMap.from({
//     joke: jokeChain,
//     intro: introChain,
//   })
  
//   const result = await mapChain.invoke({ topic: '北极熊' })
//   console.log(result)


const weatherChain = PromptTemplate.fromTemplate('查询下今天 {topic} 的天气')
  .pipe(llm)
  .pipe(new StringOutputParser())

const introChain = PromptTemplate.fromTemplate(
  '介绍 {topic} 的地理相关常识，100字以内'
)
  .pipe(llm)
  .pipe(new StringOutputParser())
  
  const mapChain = RunnableMap.from({
    weather: weatherChain,
    intro: introChain,
  })
  
  const result = await mapChain.invoke({ topic: '天津' })
  console.log(result)