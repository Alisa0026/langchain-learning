import { ChatDeepSeek } from '@langchain/deepseek'
import 'dotenv/config'
import {
    START,
    END,
    MessagesAnnotation,
    StateGraph,
    MemorySaver,
} from '@langchain/langgraph'
import { v4 as uuidv4 } from "uuid";
import { trimMessages } from "@langchain/core/messages";

const llm = new ChatDeepSeek({
    model: 'deepseek-chat',
})

const trimmer = trimMessages({
    maxTokens: 10,
    strategy: "last",
    tokenCounter: (msgs) => msgs.length,
    includeSystem: true,
    allowPartial: false,
    // startOn: "human",
  });


// Define the function that calls the model
const callModel = async (state) => {
    console.log('Input messages length: ', state.messages.length)
    // 修剪消息，保留最后 10 条
    const trimmedMessages = await trimmer.invoke(state.messages)
    console.log('Trimmed messages length: ', trimmedMessages.length)
    const response = await llm.invoke(trimmedMessages)
    return { messages: response }
}

// START --> callModel --> END
// Define a new graph
const workflow = new StateGraph(MessagesAnnotation)
    // Define the node and edge
    .addNode('model', callModel)
    .addEdge(START, 'model')
    .addEdge('model', END)


// Add memory
const memory = new MemorySaver()
const app = workflow.compile({ checkpointer: memory })


const config = { configurable: { thread_id: uuidv4() } };

// 测试函数：进行多轮对话测试消息修剪
const testTrimMessages = async () => {
    console.log('\n=== 开始测试消息修剪功能（保留最后 10 条记录）===\n')
    
    // 创建12轮对话（超过10条限制）
    const questions = [
        '你好，我是小白',
        '我叫什么名字',
        '我喜欢吃苹果',
        '你能记住我喜欢什么吗',
        '我最喜欢的颜色是蓝色',
        '请记住我的爱好',
        '我的生日是1月1日',
        '我来自北京',
        '我是一名程序员',
        '我最喜欢编程',
        '我工作了5年',
        '我之前说了哪些个人信息'
    ]
    
    for (let i = 0; i < questions.length; i++) {
        const input = [{ role: 'user', content: questions[i] }]
        
        console.log(`\n第 ${i + 1} 轮对话：`)
        console.log('用户问题：', questions[i])
        
        const output = await app.invoke({ messages: input }, config)
        
        // 显示状态中的总消息数
        console.log('状态中的总消息数：', output.messages.length)
        console.log('最后一条回复：', output.messages[output.messages.length - 1].content)
        
        // 打印消息摘要
        if (output.messages.length > 1) {
            const recentMessages = output.messages.slice(-5).map(msg => ({
                role: msg.role || msg._getType(),
                content: msg.content.substring(0, 30) + '...'
            }))
            console.log('最近5条消息预览：', JSON.stringify(recentMessages, null, 2))
        }
    }
    
    console.log('\n=== 测试完成 ===')
}

// 运行测试
await testTrimMessages()
