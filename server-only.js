const fs = require('fs');
const path = require('path');
const express = require('express');
const { getExternalIp } = require('./lib/getExternalIp');
const portManager = require('./lib/portManager');

function parseTimestamp(timestamp) {
    // Handle formats like: 2025-08-04T21_13_23_105Z or 2025_08_01T09_55_00Z
    try {
        let isoString = timestamp;
        
        // Replace underscores with colons for time part
        if (isoString.includes('T') && isoString.includes('_')) {
            const [datePart, timePart] = isoString.split('T');
            let timeFixed = timePart.replace(/_/g, ':');
            
            // Handle milliseconds format (123Z -> .123Z)
            const msMatch = timeFixed.match(/:(\d{3})Z$/);
            if (msMatch) {
                timeFixed = timeFixed.replace(/:(\d{3})Z$/, '.$1Z');
            }
            
            isoString = datePart + 'T' + timeFixed;
        }
        
        return new Date(isoString);
    } catch (e) {
        console.warn('Failed to parse timestamp:', timestamp);
        return new Date(); // fallback to current date
    }
}

async function startServer() {
    const app = express();
    
    // Get external IP and port
    const externalIpInfo = await getExternalIp();
    const port = await portManager.findAvailablePort(process.env.PORT || 9000, 9010);
    const baseUrl = `http://${externalIpInfo.ip}:${port}`;
    
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
    
    // Logging middleware
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

    // API routes
    app.get('/api/external-ip', async (req, res) => {
        try {
            const force = req.query.force === 'true';
            const ipInfo = await getExternalIp(force);
            res.json(ipInfo);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Main page - List all screenshot sessions
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

            // Generate HTML
            const html = `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Playwright Screenshot Gallery 🖼️</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
            line-height: 1.6;
            min-height: 100vh;
        }
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            padding: 20px;
            background: rgba(255, 255, 255, 0.95);
            margin-top: 20px;
            border-radius: 20px;
            backdrop-filter: blur(10px);
            box-shadow: 0 25px 45px rgba(0, 0, 0, 0.1);
        }
        .header { 
            text-align: center; 
            margin-bottom: 30px;
            padding: 20px;
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white;
            border-radius: 15px;
        }
        .header h1 { 
            font-size: 2.5em; 
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .header p { 
            opacity: 0.9; 
            font-size: 1.2em;
        }
        .server-info {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 20px;
            border-left: 4px solid #007bff;
        }
        .session-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 20px;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        .session-table th { 
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white; 
            padding: 15px; 
            text-align: left;
            font-weight: 600;
        }
        .session-table td { 
            padding: 12px 15px; 
            border-bottom: 1px solid #eee;
            transition: background-color 0.3s;
        }
        .session-table tr:hover td { 
            background-color: #f8f9fa;
        }
        .session-table a { 
            color: #667eea; 
            text-decoration: none;
            font-weight: 500;
        }
        .session-table a:hover { 
            text-decoration: underline;
            color: #764ba2;
        }
        .no-data { 
            text-align: center; 
            padding: 40px; 
            color: #666;
            font-size: 1.2em;
        }
        .site-group { 
            margin-bottom: 20px; 
        }
        .site-header { 
            background: #e9ecef; 
            padding: 10px 15px; 
            font-weight: bold;
            border-radius: 5px;
            margin-bottom: 10px;
        }
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
            `<table class="session-table">
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
                                    <a href="${baseUrl}/view/${site.name}/${session.timestamp}">👀 Просмотр</a> |
                                    <a href="${baseUrl}/download/${site.name}/${session.timestamp}">💾 Скачать</a>
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
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
            line-height: 1.6;
            min-height: 100vh;
        }
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            padding: 20px;
            background: rgba(255, 255, 255, 0.95);
            margin-top: 20px;
            border-radius: 20px;
            backdrop-filter: blur(10px);
            box-shadow: 0 25px 45px rgba(0, 0, 0, 0.1);
        }
        .back-link { 
            display: inline-block; 
            margin-bottom: 20px; 
            color: #667eea; 
            text-decoration: none;
            font-weight: 500;
        }
        .back-link:hover { 
            text-decoration: underline;
        }
        .header { 
            text-align: center; 
            margin-bottom: 30px;
            padding: 20px;
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white;
            border-radius: 15px;
        }
        .site-title { 
            font-size: 2em; 
            margin-bottom: 10px;
        }
        .timestamp { 
            opacity: 0.9;
        }
        .screenshots { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
            gap: 20px;
            margin-top: 20px;
        }
        .screenshot-item { 
            background: white; 
            border-radius: 10px; 
            overflow: hidden;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            transition: transform 0.3s;
        }
        .screenshot-item:hover { 
            transform: translateY(-5px);
        }
        .screenshot-item img { 
            width: 100%; 
            height: 200px; 
            object-fit: cover;
            cursor: pointer;
        }
        .screenshot-info { 
            padding: 15px;
        }
        .screenshot-name { 
            font-weight: bold; 
            margin-bottom: 5px;
        }
        .screenshot-size { 
            color: #666; 
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="container">
        <a href="${baseUrl}" class="back-link">← Назад к списку сайтов</a>
        <div class="header">
            <div class="site-title">🌐 ${site}</div>
            <div class="timestamp">📅 ${parseTimestamp(timestamp).toLocaleString('ru-RU')}</div>
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
    const server = app.listen(port, '0.0.0.0', () => {
        console.log(`Server running on ${baseUrl}`);
        console.log(`Results directory: ${path.join(__dirname, 'results')}`);
        
        // Save server metadata
        fs.writeFileSync('.server.meta', JSON.stringify({
            port,
            baseUrl,
            externalIp: externalIpInfo.ip,
            pid: process.pid,
            startTime: new Date().toISOString()
        }, null, 2));
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
        console.log('Received SIGTERM, shutting down gracefully');
        server.close(() => {
            process.exit(0);
        });
    });

    process.on('SIGINT', () => {
        console.log('Received SIGINT, shutting down gracefully');
        server.close(() => {
            process.exit(0);
        });
    });
}

if (require.main === module) {
    startServer().catch(console.error);
}

module.exports = { startServer, parseTimestamp };
