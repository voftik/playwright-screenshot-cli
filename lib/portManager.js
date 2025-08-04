class PortManager {
    async findAvailablePort(start, end) {
        for (let port = start; port <= end; port++) {
            if (await this.isPortAvailable(port)) {
                return port;
            }
        }
        throw new Error('No available port found');
    }

    async isPortAvailable(port) {
        return new Promise((resolve, reject) => {
            const server = require('net').createServer();
            server
                .once('error', (err) => {
                    if (err.code === 'EADDRINUSE') {
                        resolve(false);
                    } else {
                        reject(err);
                    }
                })
                .once('listening', () => {
                    server
                        .once('close', () => {
                            resolve(true);
                        })
                        .close();
                })
                .listen(port);
        });
    }
}

module.exports = new PortManager();
