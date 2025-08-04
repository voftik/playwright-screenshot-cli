const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

/**
 * Менеджер файрвола - проверяет и настраивает правила доступа
 */
class FirewallManager {
    constructor() {
        this.allowedPortRange = '9000:9010';
    }

    /**
     * Проверяет статус ufw
     * @returns {Promise<boolean>} - true если ufw активен
     */
    async isUfwActive() {
        try {
            const { stdout } = await execAsync('ufw status');
            return stdout.includes('Status: active');
        } catch (error) {
            console.warn(`⚠️ Не удалось проверить статус ufw: ${error.message}`);
            return false;
        }
    }

    /**
     * Проверяет, открыт ли порт в файрволе
     * @param {number} port - Порт для проверки
     * @returns {Promise<boolean>} - true если порт открыт
     */
    async isPortAllowed(port) {
        try {
            const { stdout } = await execAsync('ufw status numbered');
            const portRangeRegex = new RegExp(`${this.allowedPortRange}/tcp`);
            const specificPortRegex = new RegExp(`${port}/tcp`);
            
            return portRangeRegex.test(stdout) || specificPortRegex.test(stdout);
        } catch (error) {
            console.warn(`⚠️ Не удалось проверить правила файрвола: ${error.message}`);
            return true; // Предполагаем, что порт открыт, если не можем проверить
        }
    }

    /**
     * Проверяет конфигурацию файрвола для указанного порта
     * @param {number} port - Порт для проверки
     * @returns {Promise<object>} - Результат проверки
     */
    async checkFirewallForPort(port) {
        const isActive = await this.isUfwActive();
        
        if (!isActive) {
            return {
                status: 'disabled',
                message: '🔓 Файрвол отключен - порт доступен',
                needsAction: false
            };
        }

        const isAllowed = await this.isPortAllowed(port);
        
        if (isAllowed) {
            return {
                status: 'allowed',
                message: `✅ Порт ${port} разрешен в файрволе`,
                needsAction: false
            };
        }

        return {
            status: 'blocked',
            message: `🚫 Порт ${port} заблокирован в файрволе`,
            needsAction: true,
            suggestion: `Выполните: sudo ufw allow ${port}/tcp`
        };
    }

    /**
     * Выводит информацию о состоянии файрвола
     * @param {number} port - Порт для проверки
     */
    async reportFirewallStatus(port) {
        console.log(`🛡️ Проверка файрвола для порта ${port}...`);
        
        const result = await this.checkFirewallForPort(port);
        console.log(result.message);
        
        if (result.needsAction) {
            console.log(`💡 Рекомендация: ${result.suggestion}`);
            console.log(`💡 Альтернативно: Диапазон ${this.allowedPortRange} уже может быть открыт`);
        }
        
        return result;
    }
}

module.exports = { FirewallManager };
