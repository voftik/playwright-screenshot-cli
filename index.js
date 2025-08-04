const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { program } = require('commander');
const chalk = require('chalk');
const cliProgress = require('cli-progress');
const playwright = require('playwright');
const { z } = require('zod');

// URL validation schema
const urlSchema = z.string().url('Invalid URL format');

/**
 * Parse URL and extract domain name
 * @param {string} url - The URL to parse
 * @returns {string} The domain name
 */
function getDomainFromUrl(url) {
    try {
        const parsedUrl = new URL(url);
        return parsedUrl.hostname;
    } catch (error) {
        console.error(chalk.red('❌ Invalid URL:', error.message));
        process.exit(1);
    }
}

/**
 * Create directory for storing screenshots
 * @param {string} dirPath - Directory path to create
 */
function createDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

/**
 * Get formatted file size
 * @param {string} filePath - Path to the file
 * @returns {string} Formatted file size
 */
function getFileSize(filePath) {
    const stats = fs.statSync(filePath);
    const bytes = stats.size;
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Take screenshot of a website
 * @param {string} url - URL to screenshot
 * @param {Object} options - Screenshot options
 */
async function takeScreenshot(url, options) {
    console.log(chalk.blue.bold('🚀 Запуск Playwright Screenshot CLI'));
    console.log(chalk.gray(`🌐 URL: ${url}`));
    console.log(chalk.gray(`📁 Директория: ${options.outputDir}`));
    console.log(chalk.gray(`⏱️  Таймаут: ${options.timeout}ms`));

    // Validate URL
    try {
        urlSchema.parse(url);
    } catch (error) {
        console.error(chalk.red('❌ Некорректный URL:', error.errors[0].message));
        process.exit(1);
    }

    const startTime = Date.now();
    const domain = getDomainFromUrl(url);
    const timestamp = new Date().toISOString();
    const sessionDir = path.join(options.outputDir, domain, timestamp);

    console.log(chalk.yellow('📁 Создание директории...'));
    createDirectory(sessionDir);

    // Progress bar setup
    const multibar = new cliProgress.MultiBar({
        clearOnComplete: false,
        hideCursor: true,
        format: '{bar} | {percentage}% | {value}/{total} | {task}'
    }, cliProgress.Presets.shades_grey);

    const browserBar = multibar.create(5, 0, { task: 'Инициализация...' });

    let browser;
    try {
        browserBar.update(1, { task: 'Запуск браузера...' });
        browser = await playwright[options.browser].launch({ headless: true });
        
        browserBar.update(2, { task: 'Переход на страницу...' });
        const page = await browser.newPage();
        await page.setViewportSize({ width: options.width, height: options.height });
        
        browserBar.update(3, { task: 'Ожидание загрузки контента...' });
        await page.goto(url, { waitUntil: 'networkidle', timeout: options.timeout });

        // Full page screenshot
        browserBar.update(4, { task: 'Создание полного скриншота...' });
        const fullPagePath = path.join(sessionDir, 'full_page.png');
        await page.screenshot({ path: fullPagePath, fullPage: true });
        console.log(chalk.green(`✅ Полный скриншот: ${path.relative(process.cwd(), fullPagePath)} (${getFileSize(fullPagePath)})`));

        // Viewport screenshots
        browserBar.update(5, { task: 'Создание поэкранных скриншотов...' });
        console.log(chalk.yellow('📺 Создание поэкранных скриншотов...'));
        
        const viewportScreenshots = [];
        const fullHeight = await page.evaluate(() => document.body.scrollHeight);
        const viewportHeight = options.height;
        const screenshotCount = Math.ceil(fullHeight / viewportHeight);

        for (let i = 0; i < screenshotCount; i++) {
            const scrollTop = i * viewportHeight;
            await page.evaluate((scrollTop) => window.scrollTo(0, scrollTop), scrollTop);
            await page.waitForTimeout(500);

            const viewportPath = path.join(sessionDir, `viewport_${String(i).padStart(2, '0')}.png`);
            await page.screenshot({ path: viewportPath });
            console.log(chalk.green(`  📱 ${path.basename(viewportPath)} (${getFileSize(viewportPath)})`));
            viewportScreenshots.push(viewportPath);
        }

        browserBar.update(5, { task: 'Завершено!' });
        multibar.stop();

        await browser.close();

        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(1);

        console.log(chalk.green.bold('✅ Все скриншоты успешно созданы!'));
        console.log(chalk.cyan(`📂 Результаты сохранены в: ${path.relative(process.cwd(), sessionDir)}`));
        console.log(chalk.cyan(`⏱️  Время выполнения: ${duration}s`));
        console.log(chalk.cyan(`📊 Создано скриншотов: ${viewportScreenshots.length + 1} (1 полный + ${viewportScreenshots.length} поэкранных)`));

        return sessionDir;

    } catch (error) {
        multibar.stop();
        if (browser) await browser.close();
        console.error(chalk.red('❌ Критическая ошибка:', error.message));
        process.exit(1);
    }
}

/**
 * Start web server to view screenshots
 * @param {Object} options - Server options
 */
async function startWebServer(options) {
    const { getExternalIp } = require('./lib/getExternalIp');
    const portManager = require('./lib/portManager');

    try {
        console.log(chalk.yellow('🌐 Запуск веб-сервера...'));
        
        // Get external IP
        const externalIpInfo = await getExternalIp();
        const port = await portManager.findAvailablePort(options.port || 9000, 9010);
        
        // Start the server
        const serverProcess = spawn('node', ['server-only.js'], {
            env: { ...process.env, PORT: port },
            stdio: 'pipe'
        });

        // Wait for server to start
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Server start timeout'));
            }, 10000);

            serverProcess.stdout.on('data', (data) => {
                const output = data.toString();
                if (output.includes('Server running')) {
                    clearTimeout(timeout);
                    resolve();
                }
            });

            serverProcess.stderr.on('data', (data) => {
                const error = data.toString();
                if (error.includes('EADDRINUSE')) {
                    clearTimeout(timeout);
                    reject(new Error(`Port ${port} is already in use`));
                }
            });
        });

        const baseUrl = `http://${externalIpInfo?.ip || "localhost"}:${port}`;
        // Extract domain and timestamp from sessionDir for proper URL
        let sessionPath = '';
        if (options.sessionDir) {
            const pathParts = options.sessionDir.split(path.sep);
            const domain = pathParts[pathParts.length - 2];
            const timestamp = pathParts[pathParts.length - 1];
            sessionPath = `${domain}/${timestamp}`;
        }
        const sessionUrl = sessionPath ? `${baseUrl}/view/${sessionPath.replace(/[\\\/]/g, '/')}` : baseUrl;

        console.log(chalk.green.bold('✅ Веб-сервер успешно запущен!'));
        console.log(chalk.cyan.bold(`🌐 Веб-интерфейс доступен по адресу: ${baseUrl}`));
        
        if (options.sessionDir) {
            console.log(chalk.yellow.bold(`📸 Прямая ссылка на ваши скриншоты: ${sessionUrl}`));
        }
        
        console.log(chalk.gray(`🔧 Сервер работает на порту ${port}`));
        console.log(chalk.gray(`🌍 Внешний IP: ${externalIpInfo?.ip || "N/A"}`));

        return baseUrl;

    } catch (error) {
        console.error(chalk.red('❌ Критическая ошибка при запуске веб-сервера:', error.message));
        process.exit(1);
    }
}

// CLI setup
program
    .name('playwright-screenshot')
    .description('Professional Playwright Screenshot CLI')
    .version('2.0.0');

program
    .command('take')
    .description('Take screenshots of a website')
    .argument('<url>', 'URL to screenshot')
    .option('-o, --output-dir <dir>', 'Output directory', 'results')
    .option('-w, --width <number>', 'Viewport width', '1280')
    .option('-h, --height <number>', 'Viewport height', '720')
    .option('-b, --browser <browser>', 'Browser to use (chromium, firefox, webkit)', 'chromium')
    .option('-t, --timeout <number>', 'Page load timeout in ms', '30000')
    .option('--server', 'Start web server after taking screenshots')
    .option('--port <number>', 'Web server port (when --server is used)', '9000')
    .action(async (url, options) => {
        const sessionDir = await takeScreenshot(url, {
            outputDir: options.outputDir,
            width: parseInt(options.width),
            height: parseInt(options.height),
            browser: options.browser,
            timeout: parseInt(options.timeout)
        });

        if (options.server) {
            await startWebServer({ 
                port: parseInt(options.port),
                sessionDir: sessionDir
            });
        }
    });

program
    .command('serve')
    .description('Start web server to view screenshots')
    .option('-p, --port <number>', 'Server port', '9000')
    .action(async (options) => {
        await startWebServer({ port: parseInt(options.port) });
    });

program.parse();
