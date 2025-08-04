/**
 * Modernized Logger Module
 * Использует async/await и TypeScript типизацию через JSDoc
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs').promises;
const { z } = require('zod');

// Схема валидации уровня логирования
const logLevelSchema = z.enum(['error', 'warn', 'info', 'debug']);

/**
 * @typedef {'error' | 'warn' | 'info' | 'debug'} LogLevel
 */

/**
 * @typedef {Object} LoggerConfig
 * @property {LogLevel} level - Уровень логирования
 * @property {string} logDir - Директория для логов
 * @property {number} maxFiles - Максимальное количество файлов
 * @property {string} maxSize - Максимальный размер файла
 */

class ModernLogger {
  /**
   * @param {LoggerConfig} config - Конфигурация логгера
   */
  constructor(config = {}) {
    this.config = {
      level: process.env.LOG_LEVEL || 'info',
      logDir: path.join(__dirname, '..', 'logs'),
      maxFiles: 5,
      maxSize: '10m',
      ...config
    };

    this.logger = null;
    this.initialized = false;
  }

  /**
   * Асинхронная инициализация логгера
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Создаем директорию для логов
      await fs.mkdir(this.config.logDir, { recursive: true });

      // Валидация уровня логирования
      const validLevel = logLevelSchema.parse(this.config.level);

      const logFormat = winston.format.combine(
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.errors({ stack: true }),
        winston.format.printf(({ timestamp, level, message, stack }) => {
          const logMessage = `${timestamp} [${level.toUpperCase()}]: ${message}`;
          return stack ? `${logMessage}\n${stack}` : logMessage;
        })
      );

      const transports = [
        // Console transport с цветами
        new winston.transports.Console({
          level: validLevel,
          format: winston.format.combine(
            winston.format.colorize(),
            logFormat
          )
        }),
        
        // Файл для всех логов
        new winston.transports.File({
          filename: path.join(this.config.logDir, 'app.log'),
          level: validLevel,
          format: logFormat,
          maxFiles: this.config.maxFiles,
          maxsize: this.config.maxSize
        }),
        
        // Отдельный файл для ошибок
        new winston.transports.File({
          filename: path.join(this.config.logDir, 'error.log'),
          level: 'error',
          format: logFormat,
          maxFiles: this.config.maxFiles,
          maxsize: this.config.maxSize
        })
      ];

      this.logger = winston.createLogger({
        level: validLevel,
        transports,
        exitOnError: false
      });

      this.initialized = true;
      this.info('Logger initialized successfully');

    } catch (error) {
      console.error('Failed to initialize logger:', error.message);
      // Fallback к простому console логированию
      this.logger = console;
      this.initialized = false;
    }
  }

  /**
   * Проверка инициализации
   * @private
   */
  ensureInitialized() {
    if (!this.initialized) {
      // Синхронная инициализация как fallback
      this.logger = console;
    }
  }

  /**
   * Логирование информационных сообщений
   * @param {string} message - Сообщение
   * @param {...any} meta - Дополнительные данные
   */
  info(message, ...meta) {
    this.ensureInitialized();
    this.logger.info(message, ...meta);
  }

  /**
   * Логирование предупреждений
   * @param {string} message - Сообщение
   * @param {...any} meta - Дополнительные данные
   */
  warn(message, ...meta) {
    this.ensureInitialized();
    this.logger.warn(message, ...meta);
  }

  /**
   * Логирование ошибок
   * @param {string} message - Сообщение
   * @param {...any} meta - Дополнительные данные
   */
  error(message, ...meta) {
    this.ensureInitialized();
    this.logger.error(message, ...meta);
  }

  /**
   * Логирование отладочной информации
   * @param {string} message - Сообщение
   * @param {...any} meta - Дополнительные данные
   */
  debug(message, ...meta) {
    this.ensureInitialized();
    this.logger.debug(message, ...meta);
  }

  /**
   * Асинхронное получение статистики логов
   * @returns {Promise<Object>} Статистика логов
   */
  async getLogStats() {
    try {
      const logFiles = ['app.log', 'error.log'];
      const stats = {};

      for (const filename of logFiles) {
        const filePath = path.join(this.config.logDir, filename);
        try {
          const fileStat = await fs.stat(filePath);
          stats[filename] = {
            size: fileStat.size,
            modified: fileStat.mtime,
            created: fileStat.birthtime
          };
        } catch (error) {
          stats[filename] = {
            exists: false,
            error: error.message
          };
        }
      }

      return stats;
    } catch (error) {
      this.error(`Failed to get log stats: ${error.message}`);
      return { error: error.message };
    }
  }

  /**
   * Асинхронная очистка старых логов
   * @param {number} maxAgeMs - Максимальный возраст в миллисекундах
   * @returns {Promise<number>} Количество удаленных файлов
   */
  async cleanupOldLogs(maxAgeMs = 7 * 24 * 60 * 60 * 1000) { // 7 дней по умолчанию
    try {
      const files = await fs.readdir(this.config.logDir);
      const now = Date.now();
      let deletedCount = 0;

      for (const file of files) {
        if (file.endsWith('.log')) {
          const filePath = path.join(this.config.logDir, file);
          const stat = await fs.stat(filePath);
          
          if (now - stat.mtime.getTime() > maxAgeMs) {
            await fs.unlink(filePath);
            deletedCount++;
            this.info(`Deleted old log file: ${file}`);
          }
        }
      }

      return deletedCount;
    } catch (error) {
      this.error(`Failed to cleanup old logs: ${error.message}`);
      return 0;
    }
  }
}

// Создаем и инициализируем глобальный экземпляр
const logger = new ModernLogger();

// Асинхронная инициализация
(async () => {
  await logger.initialize();
})();

module.exports = logger;
