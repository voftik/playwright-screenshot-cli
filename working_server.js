const fs = require('fs');
const path = require('path');
const express = require('express');

function parseTimestamp(timestamp) {
    try {
        let isoString = timestamp;
        
        if (isoString.includes('T') && isoString.includes('_')) {
            const [datePart, timePart] = isoString.split('T');
            let timeFixed = timePart.replace(/_/g, ':');
            
            // Fix milliseconds format: change last :xxx to .xxx
            if (timeFixed.match(/:\d{3}Z$/)) {
                timeFixed = timeFixed.replace(/:(\d{3})Z$/, '.$1Z');
            }
            
            isoString = datePart + 'T' + timeFixed;
        }
        
        return new Date(isoString);
    } catch (e) {
        console.warn('Failed to parse timestamp:', timestamp);
        return new Date();
    }
}

const app = express();
const port = process.env.PORT || 9001;
const externalIp = '77.73.238.240';
const baseUrl = `http://${externalIp}:${port}`;

// Middleware
app.use(express.static('static'));
app.use(express.static('results'));
app.use(express.json());

// CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Logging
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    });
    next();
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Main page
app.get('/', (req, res) => {
    try {
        const resultsDir = path.join(__dirname, 'results');
        if (!fs.existsSync(resultsDir)) {
            fs.mkdirSync(resultsDir, { recursive: true });
        }

        const sites = [];
        const siteDirs = fs.readdirSync(resultsDir);

        for (const siteDir of siteDirs) {
            const sitePath = path.join(resultsDir, siteDir);
            if (fs.statSync(sitePath).isDirectory()) {
                const sessions = [];
                const sessionDirs = fs.readdirSync(sitePath);

                for (const sessionDir of sessionDirs) {
                    const sessionPath = path.join(sitePath, sessionDir);
                    if (fs.statSync(sessionPath).isDirectory()) {
                        const screenshots = fs.readdirSync(sessionPath)
                            .filter(file => file.endsWith('.png'));
                        
                        if (screenshots.length > 0) {
                            const timestamp = sessionDir;
                            const date = parseTimestamp(timestamp);
                            
                            sessions.push({
                                timestamp,
                                formatted: date.toLocaleString('ru-RU'),
                                count: screenshots.length
                            });
                        }
                    }
                }
                
                if (sessions.length > 0) {
                    sessions.sort((a, b) => parseTimestamp(b.timestamp) - parseTimestamp(a.timestamp));
                    sites.push({
                        name: siteDir,
                        sessions
                    });
                }
            }
        }

        const html = `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Screenshot Gallery</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; }
        .header { text-align: center; margin-bottom: 30px; color: #333; }
        .server-info { background: #e3f2fd; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: #2196f3; color: white; padding: 12px; }
        td { padding: 10px; border-bottom: 1px solid #ddd; }
        tr:hover { background: #f5f5f5; }
        a { color: #2196f3; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .no-data { text-align: center; padding: 40px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🖼️ Playwright Screenshot Gallery</h1>
            <p>Профессиональный веб-интерфейс для просмотра скриншотов</p>
        </div>
        
        <div class="server-info">
            <strong>🌐 Сервер:</strong> ${baseUrl}<br>
            <strong>📁 Директория:</strong> results/
        </div>

        ${sites.length === 0 ? 
            '<div class="no-data">Нет доступных скриншотов</div>' :
            `<table>
                <thead>
                    <tr>
                        <th>Домен</th>
                        <th>Сессия</th>
                        <th>Дата</th>
                        <th>Файлы</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    ${sites.map(site => 
                        site.sessions.map(session => `
                            <tr>
                                <td>🌐 ${site.name}</td>
                                <td><a href="${baseUrl}/view/${site.name}/${session.timestamp}">📅 ${session.formatted}</a></td>
                                <td>${session.formatted}</td>
                                <td>📊 ${session.count} скриншотов</td>
                                <td>
                                    <a href="${baseUrl}/view/${site.name}/${session.timestamp}">👀 Просмотр</a>
                                </td>
                            </tr>
                        `).join('')
                    ).join('')}
                </tbody>
            </table>`
        }
    </div>
</body>
</html>`;

        res.send(html);
    } catch (error) {
        console.error('Error generating main page:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// View specific session
app.get('/view/:site/:timestamp', (req, res) => {
    try {
        const { site, timestamp } = req.params;
        const sessionPath = path.join(__dirname, 'results', site, timestamp);
        
        if (!fs.existsSync(sessionPath)) {
            return res.status(404).send('Session not found');
        }

        const screenshots = fs.readdirSync(sessionPath)
            .filter(file => file.endsWith('.png'))
            .map(file => ({
                name: file,
                url: `${baseUrl}/${site}/${timestamp}/${file}`,
                size: fs.statSync(path.join(sessionPath, file)).size
            }));

        const html = `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Screenshots - ${site}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; }
        .back-link { display: inline-block; margin-bottom: 20px; color: #2196f3; text-decoration: none; }
        .back-link:hover { text-decoration: underline; }
        .header { text-align: center; margin-bottom: 30px; color: #333; }
        .screenshots { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .screenshot-item { background: white; border: 1px solid #ddd; border-radius: 5px; overflow: hidden; }
        .screenshot-item img { width: 100%; height: 200px; object-fit: cover; cursor: pointer; }
        .screenshot-info { padding: 15px; }
        .screenshot-name { font-weight: bold; margin-bottom: 5px; }
        .screenshot-size { color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <a href="${baseUrl}" class="back-link">← Назад к списку сайтов</a>
        <div class="header">
            <h2>🌐 ${site}</h2>
            <p>📅 ${parseTimestamp(timestamp).toLocaleString('ru-RU')}</p>
        </div>
        
        <div class="screenshots">
            ${screenshots.map(screenshot => `
                <div class="screenshot-item">
                    <img src="${screenshot.url}" alt="${screenshot.name}" onclick="window.open('${screenshot.url}', '_blank')">
                    <div class="screenshot-info">
                        <div class="screenshot-name">${screenshot.name}</div>
                        <div class="screenshot-size">${(screenshot.size / 1024).toFixed(1)} KB</div>
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>`;

        res.send(html);
    } catch (error) {
        console.error('Error generating session view:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start server
app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on ${baseUrl}`);
    console.log(`Results directory: ${path.join(__dirname, 'results')}`);
});
