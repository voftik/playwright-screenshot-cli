#!/usr/bin/env node

/**
 * Standalone server that can run independently
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');

// Enhanced error handling
process.on('uncaughtException', (error) => {
  console.error(chalk.red('🚨 Server Uncaught Exception:'), error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('🚨 Server Unhandled Rejection at:'), promise);
  console.error('Reason:', reason);
  process.exit(1);
});

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Results directory
const resultsDir = process.env.PSCREEN_RESULTS_DIR || '/var/lib/pscreen/results';

// Ensure results directory exists
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
  console.log(chalk.yellow(`📁 Created results directory: ${resultsDir}`));
}

// Static files from results directory
app.use('/static', express.static(resultsDir));
app.use('/image', express.static(resultsDir));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    version: '1.0.3',
    resultsDir,
    timestamp: new Date().toISOString()
  });
});

// Main page
app.get('/', (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  
  let domains = [];
  try {
    if (fs.existsSync(resultsDir)) {
      domains = fs.readdirSync(resultsDir)
        .filter(item => fs.statSync(path.join(resultsDir, item)).isDirectory())
        .slice(0, 10); // Limit to 10 recent domains
    }
  } catch (error) {
    console.error('Error reading results directory:', error.message);
  }

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PScreen Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #333; text-align: center; }
        .status { background: #e8f5e8; padding: 10px; border-radius: 4px; margin: 20px 0; }
        .domain-list { list-style: none; padding: 0; }
        .domain-item { background: #f9f9f9; margin: 5px 0; padding: 10px; border-radius: 4px; border-left: 4px solid #007cba; }
        .domain-item a { text-decoration: none; color: #007cba; font-weight: bold; }
        .domain-item a:hover { text-decoration: underline; }
        .no-data { text-align: center; color: #666; margin: 40px 0; }
        .footer { text-align: center; margin-top: 40px; color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎯 PScreen Dashboard</h1>
        
        <div class="status">
            <strong>✅ Server Status:</strong> Running<br>
            <strong>📁 Results Directory:</strong> ${resultsDir}<br>
            <strong>🔗 Base URL:</strong> ${baseUrl}<br>
            <strong>⏰ Server Time:</strong> ${new Date().toLocaleString()}
        </div>

        <h2>📋 Recent Screenshots</h2>
        ${domains.length > 0 ? `
        <ul class="domain-list">
          ${domains.map(domain => `
            <li class="domain-item">
              <a href="/view/${domain}">📸 ${domain}</a>
            </li>
          `).join('')}
        </ul>
        ` : '<div class="no-data">No screenshots found. Take your first screenshot!</div>'}

        <div class="footer">
            PScreen v1.0.3 | Screenshots powered by Playwright
        </div>
    </div>
</body>
</html>`;

  res.send(html);
});

// View domain screenshots
app.get('/view/:domain', (req, res) => {
  const { domain } = req.params;
  const domainDir = path.join(resultsDir, domain);
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  
  if (!fs.existsSync(domainDir)) {
    return res.status(404).send('Domain not found');
  }
  
  let sessions = [];
  try {
    sessions = fs.readdirSync(domainDir)
      .filter(item => fs.statSync(path.join(domainDir, item)).isDirectory())
      .sort()
      .reverse(); // Most recent first
  } catch (error) {
    console.error('Error reading domain directory:', error.message);
  }

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Screenshots - ${domain}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #333; }
        .back-link { display: inline-block; margin-bottom: 20px; color: #007cba; text-decoration: none; }
        .back-link:hover { text-decoration: underline; }
        .session { background: #f9f9f9; margin: 20px 0; padding: 15px; border-radius: 4px; border-left: 4px solid #007cba; }
        .session h3 { margin-top: 0; color: #333; }
        .screenshot { margin: 10px 0; }
        .screenshot img { max-width: 300px; height: auto; border: 1px solid #ddd; border-radius: 4px; }
        .screenshot a { text-decoration: none; }
        .screenshot p { margin: 5px 0; font-size: 0.9em; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <a href="/" class="back-link">← Back to Dashboard</a>
        <h1>📸 Screenshots for ${domain}</h1>
        
        ${sessions.length > 0 ? sessions.map(session => {
          const sessionDir = path.join(domainDir, session);
          let screenshots = [];
          
          try {
            screenshots = fs.readdirSync(sessionDir)
              .filter(file => file.endsWith('.png'))
              .map(file => ({
                name: file,
                url: `${baseUrl}/static/${domain}/${session}/${file}`
              }));
          } catch (error) {
            console.error('Error reading session directory:', error.message);
          }
          
          return `
          <div class="session">
            <h3>📅 Session: ${session}</h3>
            ${screenshots.length > 0 ? screenshots.map(screenshot => `
              <div class="screenshot">
                <a href="${screenshot.url}" target="_blank">
                  <img src="${screenshot.url}" alt="${screenshot.name}" loading="lazy">
                </a>
                <p><strong>${screenshot.name}</strong></p>
                <p><a href="${screenshot.url}" target="_blank">🔗 Open full size</a></p>
              </div>
            `).join('') : '<p>No screenshots found in this session</p>'}
          </div>
          `;
        }).join('') : '<p>No sessions found for this domain</p>'}
    </div>
</body>
</html>`;

  res.send(html);
});

// Get port from command line argument or environment
const port = process.argv[2] || process.env.PORT || 9000;

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(chalk.green.bold('🌐 PScreen Standalone Server Started!'));
  console.log(chalk.cyan(`📋 URL: http://localhost:${port}`));
  console.log(chalk.gray(`📁 Results: ${resultsDir}`));
  console.log(chalk.blue('\n📌 Server is running. Press Ctrl+C to stop.'));
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n🛑 Stopping server...'));
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log(chalk.yellow('\n🛑 Stopping server...'));
  process.exit(0);
});
