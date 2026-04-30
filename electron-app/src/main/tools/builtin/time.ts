import type OpenAI from 'openai'

const definition: OpenAI.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'get_current_time',
    description: '获取当前系统时间，返回本地格式化字符串',
    parameters: { type: 'object', properties: {}, required: [] },
  },
}

const execute = () => new Date().toLocaleString('zh-CN')

export default { definition, execute }
