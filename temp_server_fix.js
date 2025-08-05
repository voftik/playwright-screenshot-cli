  /**
   * Start the server with automatic port fallback
   * @param {Object} options
   */
  async startServer(options = {}) {
    try {
      const validatedOptions = validateServerOptions(options);
      let port = validatedOptions.port;
      
      // If no port specified, use getPort which includes fallback logic
      if (!port) {
        port = await portManager.getPort();
      } else {
        // If port is specified, check if it's available, if not find alternative
        const isAvailable = await portManager.isPortAvailable(port);
        if (!isAvailable) {
          logger.warn(`Specified port ${port} is not available, searching for alternative...`);
          port = await portManager.findAvailablePort();
          logger.info(`Using alternative port: ${port}`);
        }
      }

      // Get external IP
      const ipInfo = await externalIpService.getExternalIp();
      this.baseUrl = `http://${ipInfo.ip}:${port}`;

      // Start server with error handling
      return new Promise((resolve, reject) => {
        this.serverInstance = this.app.listen(port, validatedOptions.host, () => {
          logger.info(`Server running on ${this.baseUrl}`);
          logger.info(`Results directory: ${path.join(process.cwd(), config.screenshot.outputDir)}`);
          
          resolve({
            baseUrl: this.baseUrl,
            port: port,
            ip: ipInfo.ip,
            host: validatedOptions.host
          });
        });

        this.serverInstance.on('error', async (err) => {
          if (err.code === 'EADDRINUSE') {
            logger.warn(`Port ${port} became unavailable during startup, retrying with new port...`);
            try {
              const newPort = await portManager.findAvailablePort();
              this.baseUrl = `http://${ipInfo.ip}:${newPort}`;
              
              this.serverInstance = this.app.listen(newPort, validatedOptions.host, () => {
                logger.info(`Server running on ${this.baseUrl} (fallback port)`);
                resolve({
                  baseUrl: this.baseUrl,
                  port: newPort,
                  ip: ipInfo.ip,
                  host: validatedOptions.host
                });
              });
            } catch (retryError) {
              logger.error(`Failed to start server on fallback port: ${retryError.message}`);
              reject(retryError);
            }
          } else {
            logger.error(`Server error: ${err.message}`);
            reject(err);
          }
        });
      });
    } catch (error) {
      logger.error(`Failed to start server: ${error.message}`);
      throw error;
    }
  }
