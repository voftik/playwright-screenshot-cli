/**
 * Modernized Metrics Module  
 * Использует async/await и TypeScript типизацию через JSDoc
 */

const promClient = require('prom-client');
const { z } = require('zod');

// Схемы валидации
const metricLabelSchema = z.object({
  method: z.string().optional(),
  endpoint: z.string().optional(),
  status: z.string().optional()
});

/**
 * @typedef {Object} MetricLabels
 * @property {string} [method] - HTTP метод
 * @property {string} [endpoint] - Конечная точка
 * @property {string} [status] - Статус ответа
 */

/**
 * @typedef {Object} MetricsData
 * @property {number} requestsTotal - Общее количество запросов
 * @property {number} requestDuration - Длительность запроса
 * @property {number} screenshotsTotal - Общее количество скриншотов
 * @property {number} errorTotal - Общее количество ошибок
 */

class ModernMetrics {
  constructor() {
    // Регистрируем метрики по умолчанию (CPU, память и т.д.)
    promClient.collectDefaultMetrics({
      timeout: 10000,
      gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5]
    });

    this.initializeMetrics();
  }

  /**
   * Инициализация пользовательских метрик
   * @private
   */
  initializeMetrics() {
    // Счетчик HTTP запросов
    this.httpRequestsTotal = new promClient.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'endpoint', 'status']
    });

    // Гистограмма времени выполнения запросов
    this.httpRequestDuration = new promClient.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'endpoint', 'status'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30]
    });

    // Счетчик созданных скриншотов
    this.screenshotsTotal = new promClient.Counter({
      name: 'screenshots_total',
      help: 'Total number of screenshots taken',
      labelNames: ['status', 'site']
    });

    // Гистограмма времени создания скриншотов
    this.screenshotDuration = new promClient.Histogram({
      name: 'screenshot_duration_seconds',
      help: 'Duration of screenshot creation in seconds',
      labelNames: ['site', 'status'],
      buckets: [1, 5, 10, 30, 60, 120]
    });

    // Счетчик ошибок
    this.errorsTotal = new promClient.Counter({
      name: 'errors_total',
      help: 'Total number of errors',
      labelNames: ['type', 'source']
    });

    // Gauge для активных соединений
    this.activeConnections = new promClient.Gauge({
      name: 'active_connections',
      help: 'Number of active connections'
    });

    // Gauge для размера кеша
    this.cacheSize = new promClient.Gauge({
      name: 'cache_size_bytes',
      help: 'Current cache size in bytes'
    });

    // Gauge для количества файлов в результатах
    this.resultFilesCount = new promClient.Gauge({
      name: 'result_files_count',
      help: 'Number of result files'
    });
  }

  /**
   * Валидация меток метрик
   * @param {MetricLabels} labels - Метки для валидации
   * @returns {MetricLabels} Валидированные метки
   * @private
   */
  validateLabels(labels = {}) {
    try {
      return metricLabelSchema.parse(labels);
    } catch (error) {
      console.warn(`Invalid metric labels: ${error.message}`);
      return {};
    }
  }

  /**
   * Увеличение счетчика HTTP запросов
   * @param {MetricLabels} labels - Метки метрики
   */
  countRequest(labels = {}) {
    const validLabels = this.validateLabels(labels);
    this.httpRequestsTotal.inc(validLabels);
  }

  /**
   * Измерение времени выполнения HTTP запроса
   * @param {MetricLabels} labels - Метки метрики
   * @returns {Function} Функция для завершения измерения
   */
  measureRequestDuration(labels = {}) {
    const validLabels = this.validateLabels(labels);
    return this.httpRequestDuration.startTimer(validLabels);
  }

  /**
   * Увеличение счетчика созданных скриншотов
   * @param {Object} labels - Метки метрики
   * @param {string} labels.status - Статус создания ('success' | 'error')
   * @param {string} labels.site - Имя сайта
   */
  countScreenshot(labels) {
    this.screenshotsTotal.inc(labels);
  }

  /**
   * Измерение времени создания скриншота
   * @param {Object} labels - Метки метрики
   * @param {string} labels.site - Имя сайта
   * @param {string} labels.status - Статус создания
   * @returns {Function} Функция для завершения измерения
   */
  measureScreenshotDuration(labels) {
    return this.screenshotDuration.startTimer(labels);
  }

  /**
   * Увеличение счетчика ошибок
   * @param {Object} labels - Метки метрики
   * @param {string} labels.type - Тип ошибки
   * @param {string} labels.source - Источник ошибки
   */
  countError(labels) {
    this.errorsTotal.inc(labels);
  }

  /**
   * Установка количества активных соединений
   * @param {number} count - Количество соединений
   */
  setActiveConnections(count) {
    this.activeConnections.set(count);
  }

  /**
   * Увеличение количества активных соединений
   */
  incActiveConnections() {
    this.activeConnections.inc();
  }

  /**
   * Уменьшение количества активных соединений
   */
  decActiveConnections() {
    this.activeConnections.dec();
  }

  /**
   * Установка размера кеша
   * @param {number} size - Размер в байтах
   */
  setCacheSize(size) {
    this.cacheSize.set(size);
  }

  /**
   * Установка количества файлов результатов
   * @param {number} count - Количество файлов
   */
  setResultFilesCount(count) {
    this.resultFilesCount.set(count);
  }

  /**
   * Асинхронное получение всех метрик в формате Prometheus
   * @returns {Promise<string>} Метрики в формате Prometheus
   */
  async getMetrics() {
    try {
      return await promClient.register.metrics();
    } catch (error) {
      console.error(`Failed to get metrics: ${error.message}`);
      return '';
    }
  }

  /**
   * Получение метрик в JSON формате
   * @returns {Promise<Object>} Метрики в JSON формате
   */
  async getMetricsJSON() {
    try {
      const metrics = await promClient.register.getMetricsAsJSON();
      return {
        timestamp: new Date().toISOString(),
        metrics: metrics.reduce((acc, metric) => {
          acc[metric.name] = {
            help: metric.help,
            type: metric.type,
            values: metric.values
          };
          return acc;
        }, {})
      };
    } catch (error) {
      console.error(`Failed to get JSON metrics: ${error.message}`);
      return { error: error.message };
    }
  }

  /**
   * Сброс всех метрик
   */
  reset() {
    promClient.register.resetMetrics();
  }

  /**
   * Асинхронное создание middleware для Express для автоматического сбора метрик
   * @returns {Function} Express middleware
   */
  createMiddleware() {
    return (req, res, next) => {
      const startTime = Date.now();
      this.incActiveConnections();

      // Обработка завершения запроса
      res.on('finish', () => {
        const duration = (Date.now() - startTime) / 1000;
        const labels = {
          method: req.method,
          endpoint: req.route?.path || req.path,
          status: res.statusCode.toString()
        };

        this.countRequest(labels);
        this.httpRequestDuration.observe(labels, duration);
        this.decActiveConnections();
      });

      next();
    };
  }

  /**
   * Получение краткой статистики
   * @returns {Promise<Object>} Краткая статистика
   */
  async getSummaryStats() {
    try {
      const metricsJSON = await this.getMetricsJSON();
      const stats = {
        totalRequests: 0,
        totalScreenshots: 0,
        totalErrors: 0,
        activeConnections: 0,
        uptime: process.uptime(),
        memory: process.memoryUsage()
      };

      // Извлечение значений из метрик
      if (metricsJSON.metrics) {
        const httpRequests = metricsJSON.metrics.http_requests_total;
        if (httpRequests?.values) {
          stats.totalRequests = httpRequests.values.reduce((sum, val) => sum + val.value, 0);
        }

        const screenshots = metricsJSON.metrics.screenshots_total;
        if (screenshots?.values) {
          stats.totalScreenshots = screenshots.values.reduce((sum, val) => sum + val.value, 0);
        }

        const errors = metricsJSON.metrics.errors_total;
        if (errors?.values) {
          stats.totalErrors = errors.values.reduce((sum, val) => sum + val.value, 0);
        }

        const activeConns = metricsJSON.metrics.active_connections;
        if (activeConns?.values?.[0]) {
          stats.activeConnections = activeConns.values[0].value;
        }
      }

      return stats;
    } catch (error) {
      console.error(`Failed to get summary stats: ${error.message}`);
      return { error: error.message };
    }
  }
}

// Создаем глобальный экземпляр
const metrics = new ModernMetrics();

module.exports = metrics;
