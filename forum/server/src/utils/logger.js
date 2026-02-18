const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, '../../logs');

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const MAX_LOG_SIZE = 10 * 1024 * 1024; // 10MB per file

// Open write streams for async logging
const streams = {};

const getStream = (filename) => {
  if (!streams[filename]) {
    const filepath = path.join(logsDir, filename);
    streams[filename] = fs.createWriteStream(filepath, { flags: 'a' });
  }
  return streams[filename];
};

const rotateIfNeeded = (filename) => {
  const filepath = path.join(logsDir, filename);
  try {
    const stats = fs.statSync(filepath);
    if (stats.size >= MAX_LOG_SIZE) {
      // Close the existing stream
      if (streams[filename]) {
        streams[filename].end();
        delete streams[filename];
      }
      const rotatedPath = filepath.replace('.log', `-${Date.now()}.log`);
      fs.renameSync(filepath, rotatedPath);
    }
  } catch (err) {
    // File doesn't exist yet, nothing to rotate
  }
};

const getTimestamp = () => new Date().toISOString();

const appendLog = (filename, log) => {
  if (process.env.NODE_ENV === 'production') {
    rotateIfNeeded(filename);
    const stream = getStream(filename);
    stream.write(JSON.stringify(log) + '\n');
  }
};

const logger = {
  info: (message, data = {}) => {
    const log = {
      timestamp: getTimestamp(),
      level: 'INFO',
      message,
      ...data,
    };
    console.log(JSON.stringify(log));
    appendLog('info.log', log);
  },

  error: (message, error, data = {}) => {
    const log = {
      timestamp: getTimestamp(),
      level: 'ERROR',
      message,
      error: error?.message,
      stack: error?.stack,
      ...data,
    };
    console.error(JSON.stringify(log));
    appendLog('error.log', log);
  },

  warn: (message, data = {}) => {
    const log = {
      timestamp: getTimestamp(),
      level: 'WARN',
      message,
      ...data,
    };
    console.warn(JSON.stringify(log));
    appendLog('warn.log', log);
  },

  debug: (message, data = {}) => {
    if (process.env.NODE_ENV === 'development') {
      const log = {
        timestamp: getTimestamp(),
        level: 'DEBUG',
        message,
        ...data,
      };
      console.debug(JSON.stringify(log));
    }
  },
};

module.exports = logger;
