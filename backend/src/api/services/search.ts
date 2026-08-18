import { semanticSearch } from "../../lib/embeddings";
import type { SourceType } from "../../lib/types";

export async function search(input: {
  projectId:      string;
  query:          string;
  limit?:         number;
  sourceTypes?:   SourceType[];
  minSimilarity?: number;
}) {
  return semanticSearch(input.query, {
    projectId:     input.projectId,
    limit:         input.limit         || 5,
    sourceTypes:   input.sourceTypes,
    minSimilarity: input.minSimilarity || 0,
  });
}