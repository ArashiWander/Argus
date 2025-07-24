import { Client as ElasticsearchClient } from '@elastic/elasticsearch';
import { elasticsearch } from '../config/database';
import { logger } from '../config/logger';

export interface LogEntry {
  id: string;
  level: string;
  message: string;
  service: string;
  timestamp: string;
  tags: Record<string, string>;
  created_at: string;
}

export interface LogQuery {
  level?: string;
  service?: string;
  start?: string;
  end?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface LogStats {
  total_logs: number;
  unique_services: number;
  level_distribution: Record<string, number>;
  oldest_log: string | null;
  newest_log: string | null;
}

export interface PaginatedLogs {
  logs: LogEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class LogsService {
  private readonly indexName = 'argus-logs';
  private fallbackStorage: LogEntry[] = [];

  constructor() {
    this.initializeIndex();
  }

  private async initializeIndex(): Promise<void> {
    if (elasticsearch) {
      try {
        const indexExists = await elasticsearch.indices.exists({ index: this.indexName });
        
        if (!indexExists) {
          await elasticsearch.indices.create({
            index: this.indexName,
            mappings: {
              properties: {
                level: { type: 'keyword' },
                message: { type: 'text' },
                service: { type: 'keyword' },
                timestamp: { type: 'date' },
                created_at: { type: 'date' },
                tags: { type: 'object' },
              },
            },
            settings: {
              number_of_shards: 1,
              number_of_replicas: 0,
            },
          });
          logger.info(`Created Elasticsearch index: ${this.indexName}`);
        }
      } catch (error) {
        logger.error('Failed to initialize Elasticsearch index:', error);
      }
    }
  }

  async storeLog(logData: Omit<LogEntry, 'id' | 'created_at'>): Promise<string> {
    const logEntry: LogEntry = {
      id: Date.now().toString(),
      ...logData,
      created_at: new Date().toISOString(),
    };

    if (elasticsearch) {
      try {
        await elasticsearch.index({
          index: this.indexName,
          id: logEntry.id,
          document: logEntry,
        });

        logger.info(`Log stored in Elasticsearch: [${logEntry.level}] ${logEntry.message} from ${logEntry.service}`);
        return logEntry.id;
      } catch (error) {
        logger.error('Failed to store log in Elasticsearch, falling back to memory:', error);
        return this.storeFallback(logEntry);
      }
    } else {
      return this.storeFallback(logEntry);
    }
  }

  async storeBulkLogs(logsData: Omit<LogEntry, 'id' | 'created_at'>[]): Promise<number> {
    const logs: LogEntry[] = logsData.map(logData => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      ...logData,
      created_at: new Date().toISOString(),
    }));

    if (elasticsearch) {
      try {
        const body = logs.flatMap(log => [
          { index: { _index: this.indexName, _id: log.id } },
          log,
        ]);

        const response = await elasticsearch.bulk({ operations: body });

        if (response.errors) {
          logger.error('Some logs failed to store in Elasticsearch');
        }

        logger.info(`Bulk logs stored in Elasticsearch: ${logs.length} logs`);
        return logs.length;
      } catch (error) {
        logger.error('Failed to store bulk logs in Elasticsearch, falling back to memory:', error);
        return this.storeBulkFallback(logs);
      }
    } else {
      return this.storeBulkFallback(logs);
    }
  }

  private storeFallback(logEntry: LogEntry): string {
    this.fallbackStorage.push(logEntry);
    
    // Keep only last 10000 logs in memory for demo
    if (this.fallbackStorage.length > 10000) {
      this.fallbackStorage.splice(0, this.fallbackStorage.length - 10000);
    }

    logger.info(`Log stored in memory: [${logEntry.level}] ${logEntry.message} from ${logEntry.service}`);
    return logEntry.id;
  }

  private storeBulkFallback(logs: LogEntry[]): number {
    this.fallbackStorage.push(...logs);
    
    // Keep only last 10000 logs in memory for demo
    if (this.fallbackStorage.length > 10000) {
      this.fallbackStorage.splice(0, this.fallbackStorage.length - 10000);
    }

    logger.info(`Bulk logs stored in memory: ${logs.length} logs`);
    return logs.length;
  }

  async getLogs(query: LogQuery = {}): Promise<PaginatedLogs> {
    if (elasticsearch) {
      try {
        return await this.getFromElasticsearch(query);
      } catch (error) {
        logger.error('Failed to fetch logs from Elasticsearch, falling back to memory:', error);
        return this.getFromFallback(query);
      }
    } else {
      return this.getFromFallback(query);
    }
  }

  private async getFromElasticsearch(query: LogQuery): Promise<PaginatedLogs> {
    const page = query.page || 1;
    const limit = query.limit || 100;
    const from = (page - 1) * limit;

    const mustClauses: any[] = [];

    // Level filter
    if (query.level) {
      mustClauses.push({ term: { level: query.level } });
    }

    // Service filter
    if (query.service) {
      mustClauses.push({ term: { service: query.service } });
    }

    // Date range filter
    if (query.start || query.end) {
      const rangeQuery: any = {};
      if (query.start) rangeQuery.gte = query.start;
      if (query.end) rangeQuery.lte = query.end;
      mustClauses.push({ range: { timestamp: rangeQuery } });
    }

    // Search filter
    if (query.search) {
      mustClauses.push({
        multi_match: {
          query: query.search,
          fields: ['message', 'tags.*'],
          type: 'phrase_prefix',
        },
      });
    }

    const searchQuery = {
      index: this.indexName,
      query: {
        bool: {
          must: mustClauses.length > 0 ? mustClauses : [{ match_all: {} }],
        },
      },
      sort: [{ timestamp: { order: 'desc' as const } }],
      from,
      size: limit,
    };

    const response = await elasticsearch!.search(searchQuery);
    const hits = response.hits.hits as any[];
    
    const logs: LogEntry[] = hits.map(hit => hit._source);
    const total = typeof response.hits.total === 'number' 
      ? response.hits.total 
      : response.hits.total?.value || 0;

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  private getFromFallback(query: LogQuery): PaginatedLogs {
    let filteredLogs = this.fallbackStorage;

    // Apply filters
    if (query.level) {
      filteredLogs = filteredLogs.filter(log => log.level === query.level);
    }

    if (query.service) {
      filteredLogs = filteredLogs.filter(log => log.service === query.service);
    }

    if (query.search) {
      const searchTerm = query.search.toLowerCase();
      filteredLogs = filteredLogs.filter(log => 
        log.message.toLowerCase().includes(searchTerm) ||
        (log.tags && JSON.stringify(log.tags).toLowerCase().includes(searchTerm))
      );
    }

    if (query.start || query.end) {
      const startTime = query.start ? new Date(query.start).getTime() : 0;
      const endTime = query.end ? new Date(query.end).getTime() : Date.now();

      filteredLogs = filteredLogs.filter(log => {
        const logTime = new Date(log.timestamp).getTime();
        return logTime >= startTime && logTime <= endTime;
      });
    }

    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Pagination
    const page = query.page || 1;
    const limit = query.limit || 100;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

    return {
      logs: paginatedLogs,
      pagination: {
        page,
        limit,
        total: filteredLogs.length,
        pages: Math.ceil(filteredLogs.length / limit),
      },
    };
  }

  async getStats(): Promise<LogStats> {
    if (elasticsearch) {
      try {
        return await this.getStatsFromElasticsearch();
      } catch (error) {
        logger.error('Failed to get stats from Elasticsearch, falling back to memory:', error);
        return this.getStatsFromFallback();
      }
    } else {
      return this.getStatsFromFallback();
    }
  }

  private async getStatsFromElasticsearch(): Promise<LogStats> {
    const statsQuery = {
      index: this.indexName,
      size: 0,
      aggs: {
        level_distribution: {
          terms: { field: 'level' },
        },
        unique_services: {
          cardinality: { field: 'service' },
        },
        date_range: {
          stats: { field: 'timestamp' },
        },
      },
    };

    const response = await elasticsearch!.search(statsQuery);
    const aggregations = response.aggregations as any;

    const levelDistribution: Record<string, number> = {};
    if (aggregations.level_distribution?.buckets) {
      aggregations.level_distribution.buckets.forEach((bucket: any) => {
        levelDistribution[bucket.key] = bucket.doc_count;
      });
    }

    const totalLogs = typeof response.hits.total === 'number' 
      ? response.hits.total 
      : response.hits.total?.value || 0;

    return {
      total_logs: totalLogs,
      unique_services: aggregations.unique_services?.value || 0,
      level_distribution: levelDistribution,
      oldest_log: aggregations.date_range?.min_as_string || null,
      newest_log: aggregations.date_range?.max_as_string || null,
    };
  }

  private getStatsFromFallback(): LogStats {
    const logs = this.fallbackStorage;
    const levelCounts = logs.reduce((acc: any, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1;
      return acc;
    }, {});

    return {
      total_logs: logs.length,
      unique_services: new Set(logs.map(log => log.service)).size,
      level_distribution: levelCounts,
      oldest_log: logs.length > 0 ? logs[0]?.timestamp : null,
      newest_log: logs.length > 0 ? logs[logs.length - 1]?.timestamp : null,
    };
  }
}

export const logsService = new LogsService();