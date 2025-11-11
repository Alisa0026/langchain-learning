import { ChromaClient } from 'chromadb'
import { AlibabaTongyiEmbeddings } from '@langchain/community/embeddings/alibaba_tongyi'
import 'dotenv/config'

// Initialize the embedding model
const embedder = new AlibabaTongyiEmbeddings({})

// Initialize ChromaDB client
const client = new ChromaClient()

// Create or get collection
const collection = await client.getOrCreateCollection({
  name: 'test_collection',
})

// Prepare documents
const documents = [
  'vue 手册',
  'react 手册',
]

// Generate embeddings for documents
const documentEmbeddings = await Promise.all(
  documents.map((doc) => embedder.embedQuery(doc))
)

// Add documents with embeddings
await collection.add({
  ids: ['id1', 'id2'],
  documents: documents,
  embeddings: documentEmbeddings,
})

// Generate embedding for query
const queryText = 'vue 有吗？'
const queryEmbedding = await embedder.embedQuery(queryText)

// Query the collection with embedding
const results = await collection.query({
  queryEmbeddings: [queryEmbedding],
  nResults: 2, // how many results to return
})
console.log('Query results:', results)