const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const tar = require('tar');

const app = express();
const port = process.env.PORT || 3000;

const ALIST_DIR = path.join(__dirname, 'alist');
const ALIST_EXEC = path.join(ALIST_DIR, 'alist');
const CONFIG_FILE = path.join(ALIST_DIR, 'data', 'config.json');

async function downloadAlist() {
  if (fs.existsSync(ALIST_EXEC)) {
    console.log('Alist already downloaded');
    return;
  }

  console.log('Downloading Alist...');
  try {
    const response = await axios.get('https://api.github.com/repos/alist-org/alist/releases/latest');
    const asset = response.data.assets.find(asset => asset.name.includes('linux-amd64'));
    
    if (!asset) {
      throw new Error('Could not find linux-amd64 asset in the latest release');
    }
    
    const downloadUrl = asset.browser_download_url;
    console.log(`Downloading from: ${downloadUrl}`);

    const { data } = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
    const tarFile = path.join(__dirname, 'alist.tar.gz');
    fs.writeFileSync(tarFile, data);
    console.log(`Tar.gz file saved to: ${tarFile}`);

    console.log('Extracting tar.gz file...');
    await tar.x({
      file: tarFile,
      cwd: ALIST_DIR
    });
    console.log('Extraction complete');

    fs.unlinkSync(tarFile);
    fs.chmodSync(ALIST_EXEC, '755');
    console.log('Alist downloaded and extracted');
  } catch (error) {
    console.error('Error downloading or extracting Alist:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

function createConfig() {
  const config = {
    force: false,
    address: "0.0.0.0",
    port: process.env.ALIST_PORT || 5244,
    database: {
      type: "mysql",
      host: process.env.MYSQL_HOST,
      port: parseInt(process.env.MYSQL_PORT || "3306"),
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      name: process.env.MYSQL_DATABASE
    },
    scheme: {
      https: false,
      cert_file: "",
      key_file: ""
    },
    cache: {
      expiration: 60,
      cleanup_interval: 120
    }
  };

  fs.mkdirSync(path.dirname(CONFIG_FILE), { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  console.log('Config file created');
}

async function startAlist() {
  try {
    await downloadAlist();
    createConfig();

    console.log('Starting Alist...');
    const alist = spawn(ALIST_EXEC, ['server', '--data', path.dirname(CONFIG_FILE)]);

    alist.stdout.on('data', (data) => {
      console.log(`Alist: ${data}`);
    });

    alist.stderr.on('data', (data) => {
      console.error(`Alist Error: ${data}`);
    });

    alist.on('close', (code) => {
      console.log(`Alist process exited with code ${code}`);
    });
  } catch (error) {
    console.error('Error starting Alist:', error.message);
  }
}

app.get('/', (req, res) => {
  res.send('Alist is running. Access it directly on its port.');
});

app.listen(port, () => {
  console.log(`Express server listening at http://localhost:${port}`);
  startAlist();
});
