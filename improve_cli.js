const fs = require('fs');

let content = fs.readFileSync('index.js', 'utf8');

// Add progress bar library
content = content.replace(
    /(const chalk = require\('chalk'\);)/,
    '$1\nconst cliProgress = require('cli-progress');'
);

// Update takeScreenshot function to use progress bars
content = content.replace(
    /async function takeScreenshot\(url, options\) \{/,
    `async function takeScreenshot(url, options) {
        console.log(chalk.blue.bold('🚀 Запуск Playwright Screenshot CLI'));
        const multibar = new cliProgress.MultiBar({
            clearOnComplete: false,
            hideCursor: true
        }, cliProgress.Presets.shades_grey);

        const browserBar = multibar.create(4, 0);
        browserBar.update(0, { task: 'Запуск браузера...' });`
);

// Replace browser launch with progress
content = content.replace(
    /const browser = await playwright\[options.browser\]\.launch\(\{ headless: true \}\);/,
    `const browser = await playwright[options.browser].launch({ headless: true });
        browserBar.update(1, { task: 'Переход на страницу...' });`
);

// Replace page navigation with progress 
content = content.replace(
    /await page\.goto\(url, \{ waitUntil: 'networkidle', timeout: options.timeout \}\);/,
    `await page.goto(url, { waitUntil: 'networkidle', timeout: options.timeout });
        browserBar.update(2, { task: 'Создание полного скриншота...' });`
);

// Replace full page screenshot with progress
content = content.replace(
    /await page\.screenshot\(\{ path: fullPagePath, fullPage: true \}\);/,
    `await page.screenshot({ path: fullPagePath, fullPage: true });
        browserBar.update(3, { task: 'Создание поэкранных скриншотов...' });`
);

// Replace final steps with progress completion
content = content.replace(
    /multibar.stop\(\);\n        console.log\(chalk.green.bold\('\n✅ Все скриншоты успешно созданы!'\)\);/,
    `browserBar.update(4, { task: 'Завершено!' });
        multibar.stop();
        console.log(chalk.green.bold('\n✅ Все скриншоты успешно созданы!'));`
);

// Update CLI output to show absolute URL
content = content.replace(
    /console\.log\(chalk\.cyan\(`\n🌐 Веб-сервер запущен\. Проверьте \u001b\[1m${baseUrl}\u001b\[22m`\)\);/,
    `console.log(chalk.cyan.bold(`\n🌐 Веб-интерфейс доступен по адресу: ${baseUrl}`));`
);

fs.writeFileSync('index.js', content);
console.log('CLI output improved!');

