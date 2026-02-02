import { ModelUsage, APIUsageStats } from './types';

/**
 * Utility class to merge API usage data with cache model usage data
 */
export class ModelUsageUnifier {
  /**
   * Merge API data (GLM) into cache model usage
   * @param cacheModelUsage - Model usage from stats-cache.json
   * @param apiUsage - API usage stats from ZHIPU/ZAI API
   * @returns Unified model usage record
   */
  static mergeModelUsage(
    cacheModelUsage: Record<string, ModelUsage>,
    apiUsage: APIUsageStats | null
  ): Record<string, ModelUsage> {
    const result: Record<string, ModelUsage> = { ...cacheModelUsage };

    if (!apiUsage || apiUsage.modelUsage.length === 0) {
      return result;
    }

    // Aggregate API hourly usage to get total tokens
    const totalTokens = apiUsage.modelUsage.reduce(
      (sum, hour) => sum + hour.tokenCount,
      0
    );

    if (totalTokens === 0) {
      return result;
    }

    // Use a consistent model name for GLM from API
    const glmModelName = 'glm-4.7';

    // Create ModelUsage entry with totalTokens from API
    result[glmModelName] = {
      inputTokens: 0,
      outputTokens: 0,
      cacheReadInputTokens: 0,
      cacheCreationInputTokens: 0,
      webSearchRequests: 0,
      costUSD: 0,
      contextWindow: 0,
      maxOutputTokens: 0,
      totalTokens: totalTokens,
    };

    return result;
  }
}
