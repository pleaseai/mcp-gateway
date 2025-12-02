# Embedding Model Comparison

This document compares lightweight embedding models suitable for local deployment with transformers.js.

## Current Implementation

MCP Search uses **MongoDB/mdbr-leaf-ir** as the default local embedding provider.

## Benchmark Results (BEIR nDCG@10)

Models ranked by BEIR score for models ≤100M parameters:

| Model | Parameters | Dimensions | BEIR Score | MRL Support |
|-------|------------|------------|------------|-------------|
| **mdbr-leaf-ir (asymmetric)** | 23M | 256-768 | **54.03** | Yes |
| **mdbr-leaf-ir** | 23M | 256-768 | **53.55** | Yes |
| snowflake-arctic-embed-s | 32M | 384 | 51.98 | No |
| bge-small-en-v1.5 | 33M | 384 | 51.65 | No |
| snowflake-arctic-embed-xs | 23M | 384 | 50.15 | No |
| all-MiniLM-L6-v2 | 23M | 384 | 41.95 | No |

> **Note**: mdbr-leaf-ir ranks #1 on the BEIR public leaderboard for models with ≤100M parameters.

## Model Details

### MongoDB/mdbr-leaf-ir (Recommended)

- **Parameters**: 22.6M
- **Dimensions**: 768 (native), supports MRL truncation to 64/128/256/384/512
- **Memory**: ~90MB
- **License**: Apache 2.0
- **Optimized for**: Information retrieval, semantic search, RAG pipelines

Key features:
- Trained using LEAF (Lightweight Embedding Alignment Framework)
- Distilled from snowflake-arctic-embed-m-v1.5
- Supports Matryoshka Representation Learning (MRL) for dimension flexibility
- Asymmetric retrieval support for enhanced performance

### all-MiniLM-L6-v2 (Legacy)

- **Parameters**: 22M
- **Dimensions**: 384 (fixed)
- **Memory**: ~90MB
- **License**: Apache 2.0
- **Optimized for**: General-purpose sentence embeddings

Key features:
- Widely adopted and well-documented
- Fast inference
- Limited context length (512 tokens)
- Lower retrieval accuracy compared to newer models

### bge-small-en-v1.5

- **Parameters**: 33M
- **Dimensions**: 384 (fixed)
- **Memory**: ~130MB
- **License**: MIT
- **Optimized for**: Retrieval tasks

Key features:
- Query instruction prefix support
- Strong retrieval performance
- Slightly larger memory footprint

### snowflake-arctic-embed-xs

- **Parameters**: 22M
- **Dimensions**: 384 (fixed)
- **Memory**: ~90MB
- **License**: Apache 2.0
- **Optimized for**: Retrieval tasks

Key features:
- Same model family as mdbr-leaf-ir's teacher
- Compact and efficient

## Memory Requirements

| Model | FP32 | FP16 | INT8 (q8) |
|-------|------|------|-----------|
| mdbr-leaf-ir | ~90MB | ~45MB | ~23MB |
| all-MiniLM-L6-v2 | ~90MB | ~45MB | ~23MB |
| bge-small-en-v1.5 | ~130MB | ~65MB | ~33MB |
| nomic-embed-text-v1.5 | ~550MB | ~275MB | ~140MB |

## Recommendation

For local deployment with transformers.js:

1. **Best Performance**: Use `mdbr-leaf-ir` with MRL truncation (256 dims recommended)
2. **Smallest Footprint**: Use `mdbr-leaf-ir` with INT8 quantization and 128 dims
3. **Legacy Compatibility**: Keep `all-MiniLM-L6-v2` for existing indexes

## Configuration Example

```typescript
import { MDBRLeafEmbeddingProvider } from '@pleaseai/mcp-core'

// Recommended: 256 dimensions with FP32
const provider = new MDBRLeafEmbeddingProvider(
  'MongoDB/mdbr-leaf-ir',
  256,  // dimensions (MRL truncation)
  'fp32' // dtype
)

// Compact: 128 dimensions with INT8
const compactProvider = new MDBRLeafEmbeddingProvider(
  'MongoDB/mdbr-leaf-ir',
  128,
  'q8'
)
```

## References

- [MongoDB/mdbr-leaf-ir - Hugging Face](https://huggingface.co/MongoDB/mdbr-leaf-ir)
- [LEAF: Distillation of Text Embedding Models - MongoDB Blog](https://www.mongodb.com/company/blog/engineering/leaf-distillation-state-of-the-art-text-embedding-models)
- [MTEB Leaderboard - Hugging Face](https://huggingface.co/spaces/mteb/leaderboard)
- [BEIR Benchmark](https://github.com/beir-cellar/beir)
