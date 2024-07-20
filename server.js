const { exec } = require('child_process');
const fs = require('fs');
const https = require('https');
const path = require('path');

const ALIST_VERSION = 'v3.35.0';  // 更新到最新版本
const ALIST_DOWNLOAD_URL = `https://github.com/alist-org/alist/releases/download/${ALIST_VERSION}/alist-linux-amd64.tar.gz`;
const ALIST_PATH = path.join(__dirname, 'alist');

// 下载并解压 Alist
function downloadAndExtractAlist() {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(ALIST_PATH)) {
      console.log('Alist already downloaded');
      return resolve();
    }

    console.log('Downloading Alist...');
    const file = fs.createWriteStream('alist.tar.gz');
    https.get(ALIST_DOWNLOAD_URL, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(() => {
          console.log('Download completed. Extracting...');
          exec(`mkdir -p ${ALIST_PATH} && tar -xzf alist.tar.gz -C ${ALIST_PATH}`, (error) => {
            if (error) {
              console.error('Extraction failed:', error);
              return reject(error);
            }
            console.log('Extraction completed');
            fs.unlinkSync('alist.tar.gz');
            resolve();
          });
        });
      });
    }).on('error', (err) => {
      console.error('Download failed:', err);
      reject(err);
    });
  });
}

// 创建配置文件
function createConfig() {
  const configPath = path.join(ALIST_PATH, 'data', 'config.json');
  const config = {
    force: false,
    address: '0.0.0.0',
    port: process.env.PORT || 3000,
    database: {
      type: 'sqlite3',
      host: '',
      port: 0,
      user: '',
      password: '',
      name: 'data/alist.db'
    },
    scheme: {
      https: false,
      cert_file: '',
      key_file: ''
    },
    cache: {
      expiration: 60,
      cleanup_interval: 120
    }
  };

  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log('Config file created');
}

// 主函数
async function main() {
  try {
    await downloadAndExtractAlist();
    createConfig();
    console.log('Starting Alist...');
    exec(`${ALIST_PATH}/alist server --data ${ALIST_PATH}/data`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Alist execution error: ${error}`);
        return;
      }
      console.log(`Alist stdout: ${stdout}`);
      console.error(`Alist stderr: ${stderr}`);
    });
  } catch (error) {
    console.error('Failed to start Alist:', error);
  }
}

main();
