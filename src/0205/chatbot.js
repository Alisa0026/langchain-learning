import { ChatDeepSeek } from '@langchain/deepseek'
import 'dotenv/config'

const llm = new ChatDeepSeek({
    model: 'deepseek-chat',
})

// const res1 = await llm.invoke([{ role: 'user', content: '你好，我是小白' }])
// console.log('res1 ', res1)

// 无法知道我的名字
// const res2 = await llm.invoke([{ role: 'user', content: '我是谁？' }])
// console.log('res2 ', res2)


const res3 = await llm.invoke([
    { role: 'user', content: '你好，我是双越' },
    { role: 'assistant', content: '你好，双越！今天我能帮你什么？' },
    { role: 'user', content: '我叫什么名字' },
])
console.log('res3 ', res3)