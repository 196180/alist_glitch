require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const { execSync, spawn } = require('child_process');

const ALIST_VERSION = process.env.ALIST_VERSION || 'v3.36.0';
const ALIST_DOWNLOAD_URL = `https://github.com/alist-org/alist/releases/download/${ALIST_VERSION}/alist-linux-amd64.tar.gz`;
const CLOUDFLARED_DOWNLOAD_URL = 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64';

async function downloadFile(url, outputPath) {
  const response = await axios({
    method: 'get',
    url: url,
    responseType: 'stream'
  });

  response.data.pipe(fs.createWriteStream(outputPath));

  await new Promise((resolve, reject) => {
    response.data.on('end', resolve);
    response.data.on('error', reject);
  });
}

async function downloadAndExtractAlist() {
  await downloadFile(ALIST_DOWNLOAD_URL, 'alist.tar.gz');
  execSync('tar -xzvf alist.tar.gz');
  execSync('chmod +x alist');
}

async function downloadCloudflared() {
  await downloadFile(CLOUDFLARED_DOWNLOAD_URL, 'cloudflared');
  execSync('chmod +x cloudflared');
}

function createConfig() {
  const config = {
    force: false,
    address: '0.0.0.0',
    port: parseInt(process.env.PORT) || 3000,
    scheme: {
      https: false,
      cert_file: '',
      key_file: ''
    },
    cache: {
      expiration: 60,
      cleanup_interval: 120
    },
    database: {
      type: 'mysql',
      host: process.env.MYSQL_HOST,
      port: parseInt(process.env.MYSQL_PORT) || 3306,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      name: process.env.MYSQL_DATABASE
    }
  };

  if (!fs.existsSync('data')) {
    fs.mkdirSync('data');
  }

  fs.writeFileSync('data/config.json', JSON.stringify(config, null, 2));
}

function startAlist() {
  const alist = spawn('./alist', ['server', '--data', './data'], {
    stdio: 'inherit'
  });

  alist.on('close', (code) => {
    console.log(`Alist process exited with code ${code}`);
  });
}

function startCloudflaredTunnel() {
  const cloudflared = spawn('./cloudflared', ['tunnel', '--no-autoupdate', 'run', '--token', process.env.CLOUDFLARE_TUNNEL_TOKEN], {
    stdio: 'inherit'
  });

  cloudflared.on('close', (code) => {
    console.log(`Cloudflared process exited with code ${code}`);
  });
}

async function main() {
  try {
    await downloadAndExtractAlist();
    await downloadCloudflared();
    createConfig();
    startAlist();
    startCloudflaredTunnel();
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

main();
