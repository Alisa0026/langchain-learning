/**
 * 向量化
 * langChian 支持阿里通义千问的 embedding model :https://docs.langchain.com/oss/javascript/integrations/text_embedding/alibaba_tongyi
 * 
 */
import { AlibabaTongyiEmbeddings } from '@langchain/community/embeddings/alibaba_tongyi'
import 'dotenv/config'

const model = new AlibabaTongyiEmbeddings({})
const res = await model.embedQuery(
  'What would be a good company name a company that makes colorful socks?'
)
console.log({ res })