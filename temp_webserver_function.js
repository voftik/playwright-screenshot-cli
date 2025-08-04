// Временная функция startWebServer с интеграцией портменеджера
async function startWebServer(resultsDir, preferredPort = 3000) {
  const { PortManager } = require('./lib/portManager');
  const { FirewallManager } = require('./lib/firewallManager');
  
  try {
    console.log('🔍 Инициализация веб-сервера...');
    
    // Инициализация менеджеров
    const portManager = new PortManager({ 
      preferredPort: preferredPort,
      portRange: { min: 9000, max: 9010 }
    });
    const firewallManager = new FirewallManager();
    
    // Получение порта
    const serverInfo = await portManager.getOrCreateServer();
    const actualPort = serverInfo.port;
    
    if (serverInfo.isNew) {
      console.log(`✅ Будет использован порт: ${actualPort}`);
      
      // Проверка файрвола
      await firewallManager.reportFirewallStatus(actualPort);
    } else {
      console.log(`🔄 Переиспользуется существующий сервер на порту ${actualPort}`);
      return { port: actualPort, server: null }; // Сервер уже запущен
    }
    
    // Создание Express приложения (упрощенная версия для CLI)
    const app = express();
    
    // CORS
    app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      next();
    });
    
    // Простой роут для CLI версии
    app.get('/', (req, res) => {
      res.send(`
        <html>
          <body>
            <h1>Screenshot Server Active</h1>
            <p>Port: ${actualPort}</p>
            <p>Use server-only.js for full web interface</p>
          </body>
        </html>
      `);
    });

    const server = http.createServer(app);
    
    return new Promise((resolve, reject) => {
      server.listen(actualPort, '0.0.0.0', (err) => {
        if (err) {
          reject(err);
        } else {
          // Сохранение метаданных
          const externalIp = '77.73.238.240'; // Временно захардкодим
          portManager.saveServerMeta(actualPort, process.pid, externalIp);
          
          resolve({ server, port: actualPort });
        }
      });
    });
    
  } catch (error) {
    console.error('❌ Ошибка инициализации веб-сервера:', error.message);
    throw error;
  }
}
