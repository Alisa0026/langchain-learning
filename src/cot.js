
import { ChatDeepSeek } from '@langchain/deepseek'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import 'dotenv/config'

const systemPrompt = `
使用 langchain 调用 deepseek 接口，来帮我回答一个常见的面试题 “如果一个网页加载速度慢，该如何处理”。

但 AI 不能随意发挥，请使用 **Chain-of-Thought** 来引导 AI 思考问题，最后给出答案。

1. 进行性能监控，确定是否慢？慢多少？
2. 性能数据分析，分析哪里吗？瓶颈在哪里
3. 找到瓶颈，分析它的原因，找出解决方案
4. 解决问题
`

const humanPromptTemplate = `请基于上述系统角色，回答用户问题：\n\n问题：如果一个网页加载速度慢，该如何处理？\n\n请严格返回两个部分：\n- Reasoning Summary: <短摘要>\n- Final Answer: <分步骤、条理清晰的操作性建议>\n\n只需输出这两个部分，不要输出其他内容。
`


const messages = [
    new SystemMessage(systemPrompt),
    new HumanMessage(humanPromptTemplate),
]

const llm = new ChatDeepSeek({
    model: 'deepseek-chat',
})

const res = await llm.invoke(messages)
// Print the content returned by the model
console.log(res.content)