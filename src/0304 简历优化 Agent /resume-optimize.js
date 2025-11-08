/**
 * 简历优化 Agent
 * 功能：
 * 1. 提取信息：个人信息、专业技能、项目经验
 * 2. 分析：判断技能、经验是否匹配工作年限
 * 3. 给出优化建议
 */

import { ChatDeepSeek } from '@langchain/deepseek'
import 'dotenv/config'
import { tool } from 'langchain'
import * as z from 'zod'
import { StateGraph, START, END } from '@langchain/langgraph'
import { HumanMessage, AIMessage } from '@langchain/core/messages'
import { fileURLToPath } from 'url'

// 初始化 LLM
const llm = new ChatDeepSeek({
  model: 'deepseek-chat',
  temperature: 0.3, // 降低温度以获得更稳定的输出
})

// 定义状态结构
const ResumeState = z.object({
  resumeText: z.string().describe('原始简历文本'),
  parsedInfo: z.object({
    personalInfo: z.string().optional().describe('个人信息'),
    skills: z.string().optional().describe('专业技能'),
    workExperience: z.string().optional().describe('工作年限'),
    projectExperience: z.string().optional().describe('项目经验'),
  }).optional().describe('解析后的结构化信息'),
  skillAnalysis: z.string().optional().describe('专业技能分析结果'),
  projectAnalysis: z.string().optional().describe('项目经验分析结果'),
  suggestions: z.string().optional().describe('最终优化建议'),
  messages: z.array(z.any()).describe('对话消息历史'),
})

// 定义工具：解析简历内容
const parseResumeTool = tool(
  async (input) => {
    const prompt = `请从以下简历文本中提取并格式化以下信息：
1. 个人信息：包括姓名、联系方式、工作年限等
2. 专业技能：列出所有技术技能
3. 项目经验：详细列出所有项目经验

简历文本：
${input.resumeText}

请以 JSON 格式返回，包含以下字段：
{
  "personalInfo": "个人信息内容",
  "skills": "专业技能内容",
  "workExperience": "工作年限（如：3年、5年等）",
  "projectExperience": "项目经验内容"
}`

    const response = await llm.invoke([new HumanMessage(prompt)])
    return response.content
  },
  {
    name: 'parse_resume',
    description: '解析简历文本，提取个人信息、专业技能、工作年限和项目经验',
    schema: z.object({
      resumeText: z.string().describe('要解析的简历文本'),
    }),
  }
)

// 定义工具：分析专业技能
const analyzeSkillsTool = tool(
  async (input) => {
    const prompt = `作为资深技术专家，请分析以下程序员的专业技能：

专业技能：
${input.skills}

工作年限：
${input.workExperience}

请从以下维度进行分析：
1. 技能深度：技能的掌握程度是否与工作年限匹配？
2. 技能广度：技能覆盖面是否合理？
3. 技能相关性：技能组合是否合理？
4. 是否存在明显不足或需要改进的地方？

请给出详细的分析报告。`

    const response = await llm.invoke([new HumanMessage(prompt)])
    return response.content
  },
  {
    name: 'analyze_skills',
    description: '分析专业技能的深度、广度是否与工作年限匹配',
    schema: z.object({
      skills: z.string().describe('专业技能内容'),
      workExperience: z.string().describe('工作年限'),
    }),
  }
)

// 定义工具：分析项目经验
const analyzeProjectsTool = tool(
  async (input) => {
    const prompt = `作为资深技术专家，请分析以下程序员的项目经验：

项目经验：
${input.projectExperience}

工作年限：
${input.workExperience}

请从以下维度进行分析：
1. 项目复杂度：项目难度是否与工作年限匹配？
2. 技术深度：项目中使用的技术栈和解决方案是否合理？
3. 项目规模：项目规模是否与经验水平匹配？
4. 项目描述：项目描述是否清晰、有说服力？
5. 是否存在明显不足或需要改进的地方？

请给出详细的分析报告。`

    const response = await llm.invoke([new HumanMessage(prompt)])
    return response.content
  },
  {
    name: 'analyze_projects',
    description: '分析项目经验的内容、难度是否与工作经验匹配',
    schema: z.object({
      projectExperience: z.string().describe('项目经验内容'),
      workExperience: z.string().describe('工作年限'),
    }),
  }
)

// 定义工具：生成优化建议
const generateSuggestionsTool = tool(
  async (input) => {
    const prompt = `基于以下分析结果，为程序员简历生成优化建议：

个人信息：
${input.parsedInfo.personalInfo || '未提供'}

专业技能：
${input.parsedInfo.skills || '未提供'}

工作年限：
${input.parsedInfo.workExperience || '未提供'}

项目经验：
${input.parsedInfo.projectExperience || '未提供'}

专业技能分析：
${input.skillAnalysis}

项目经验分析：
${input.projectAnalysis}

请生成一份详细的简历优化建议，包括：
1. 整体评价
2. 专业技能方面的改进建议
3. 项目经验方面的改进建议
4. 其他优化建议（如格式、表达等）
5. 优先级排序的建议

请以清晰、可执行的格式输出建议。`

    const response = await llm.invoke([new HumanMessage(prompt)])
    return response.content
  },
  {
    name: 'generate_suggestions',
    description: '根据分析结果生成最终的优化建议',
    schema: z.object({
      parsedInfo: z.any().describe('解析后的简历信息'),
      skillAnalysis: z.string().describe('专业技能分析结果'),
      projectAnalysis: z.string().describe('项目经验分析结果'),
    }),
  }
)

// 节点1：解析简历
async function parseResumeNode(state) {
  const resumeText = state.resumeText
  const parsedResult = await parseResumeTool.invoke({ resumeText })
  
  // 尝试解析 JSON（如果 LLM 返回的是 JSON 字符串）
  let parsedInfo
  try {
    // 提取 JSON 部分（可能包含 markdown 代码块）
    const jsonMatch = parsedResult.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || 
                      parsedResult.match(/(\{[\s\S]*\})/)
    if (jsonMatch) {
      parsedInfo = JSON.parse(jsonMatch[1])
    } else {
      // 如果不是 JSON，使用 LLM 再次解析
      parsedInfo = {
        personalInfo: parsedResult,
        skills: parsedResult,
        workExperience: parsedResult,
        projectExperience: parsedResult,
      }
    }
  } catch (e) {
    // 解析失败，使用原始结果
    parsedInfo = {
      personalInfo: parsedResult,
      skills: parsedResult,
      workExperience: parsedResult,
      projectExperience: parsedResult,
    }
  }

  // 只返回需要更新的字段，不要包含整个 state
  return {
    parsedInfo,
  }
}

// 节点2：分析专业技能
async function analyzeSkillsNode(state) {
  if (!state.parsedInfo?.skills || !state.parsedInfo?.workExperience) {
    return {
      skillAnalysis: '缺少专业技能或工作年限信息，无法进行分析',
    }
  }

  const analysis = await analyzeSkillsTool.invoke({
    skills: state.parsedInfo.skills,
    workExperience: state.parsedInfo.workExperience,
  })

  // 只返回需要更新的字段
  return {
    skillAnalysis: analysis,
  }
}

// 节点3：分析项目经验
async function analyzeProjectsNode(state) {
  if (!state.parsedInfo?.projectExperience || !state.parsedInfo?.workExperience) {
    return {
      projectAnalysis: '缺少项目经验或工作年限信息，无法进行分析',
    }
  }

  const analysis = await analyzeProjectsTool.invoke({
    projectExperience: state.parsedInfo.projectExperience,
    workExperience: state.parsedInfo.workExperience,
  })

  // 只返回需要更新的字段
  return {
    projectAnalysis: analysis,
  }
}

// 节点4：生成优化建议
async function generateSuggestionsNode(state) {
  if (!state.parsedInfo || !state.skillAnalysis || !state.projectAnalysis) {
    return {
      suggestions: '缺少必要的分析结果，无法生成建议',
    }
  }

  const suggestions = await generateSuggestionsTool.invoke({
    parsedInfo: state.parsedInfo,
    skillAnalysis: state.skillAnalysis,
    projectAnalysis: state.projectAnalysis,
  })

  // 只返回需要更新的字段
  return {
    suggestions,
  }
}

// 构建状态图
const workflow = new StateGraph(ResumeState)
  .addNode('parseResume', parseResumeNode)
  .addNode('analyzeSkills', analyzeSkillsNode)
  .addNode('analyzeProjects', analyzeProjectsNode)
  .addNode('generateSuggestions', generateSuggestionsNode)
  .addEdge(START, 'parseResume')
  .addEdge('parseResume', 'analyzeSkills')
  .addEdge('parseResume', 'analyzeProjects')
  .addEdge('analyzeSkills', 'generateSuggestions')
  .addEdge('analyzeProjects', 'generateSuggestions')
  .addEdge('generateSuggestions', END)

// 编译图
const app = workflow.compile()

// 主函数：优化简历
export async function optimizeResume(resumeText) {
  const initialState = {
    resumeText,
    messages: [new HumanMessage(`请优化以下简历：\n\n${resumeText}`)],
  }

  const result = await app.invoke(initialState)

  return {
    parsedInfo: result.parsedInfo,
    skillAnalysis: result.skillAnalysis,
    projectAnalysis: result.projectAnalysis,
    suggestions: result.suggestions,
  }
}

// 示例使用
async function main() {
  const sampleResume = `
姓名：张三
电话：13800138000
邮箱：zhangsan@example.com
工作年限：3年

专业技能：
- JavaScript, TypeScript
- React, Vue
- Node.js
- MySQL

项目经验：
1. 电商平台（2021-2022）
   - 使用 React 开发前端页面
   - 使用 Node.js 开发后端接口
   - 使用 MySQL 存储数据

2. 管理系统（2022-2023）
   - 使用 Vue 开发管理界面
   - 实现用户权限管理功能
  `

  console.log('开始优化简历...\n')
  const result = await optimizeResume(sampleResume)
  
  console.log('='.repeat(60))
  console.log('解析后的简历信息：')
  console.log('='.repeat(60))
  console.log(JSON.stringify(result.parsedInfo, null, 2))
  
  console.log('\n' + '='.repeat(60))
  console.log('专业技能分析：')
  console.log('='.repeat(60))
  console.log(result.skillAnalysis)
  
  console.log('\n' + '='.repeat(60))
  console.log('项目经验分析：')
  console.log('='.repeat(60))
  console.log(result.projectAnalysis)
  
  console.log('\n' + '='.repeat(60))
  console.log('优化建议：')
  console.log('='.repeat(60))
  console.log(result.suggestions)
}

// 如果直接运行此文件，执行示例
const isMainModule = process.argv[1] && 
  fileURLToPath(import.meta.url) === process.argv[1]

if (isMainModule) {
  main().catch(console.error)
}
