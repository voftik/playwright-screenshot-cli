// Главная страница с использованием EJS шаблонов
app.get('/', async (req, res) => {
    try {
        const domainsRaw = fs.readdirSync(RESULTS_DIR, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        // Получаем внешний IP и базовый URL для отображения в интерфейсе
        let externalIpInfo = null;
        let baseUrl = null;
        try {
            externalIpInfo = await getExternalIp();
            baseUrl = await getBaseUrl(req);
        } catch (error) {
            logger.warn('Failed to get external IP for dashboard', { error: error.message });
        }

        // Подготавливаем данные для шаблона
        const templateData = {
            domainsRaw,
            externalIpInfo,
            baseUrl,
            resultsDir: RESULTS_DIR
        };

        // Рендерим страницу с помощью EJS
        const html = await templateRenderer.renderDashboard(templateData);
        res.send(html);
    } catch (error) {
        logger.error('Error rendering dashboard', { error: error.message, stack: error.stack });
        res.status(500).send(`Ошибка: ${error.message}`);
    }
});
