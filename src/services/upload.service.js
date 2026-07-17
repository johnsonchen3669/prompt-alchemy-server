const { Storage } = require('@google-cloud/storage');
const env = require('../config/env');
const path = require('path');

let storage;
let bucket;

// 只有在環境變數存在時才初始化，避免伺服器啟動失敗
if (env.gcp.projectId && env.gcp.clientEmail && env.gcp.privateKey && env.gcp.bucketName) {
  storage = new Storage({
    projectId: env.gcp.projectId,
    credentials: {
      client_email: env.gcp.clientEmail,
      // 確保將環境變數中的 \n 轉換為真實的換行符號
      private_key: env.gcp.privateKey.replace(/\\n/g, '\n'),
    },
  });
  bucket = storage.bucket(env.gcp.bucketName);
}

/**
 * 上傳檔案至 GCP Bucket
 * @param {Object} file - multer 產生的 file object (包含 buffer, originalname, mimetype 等)
 * @returns {Promise<string>} 回傳檔案的公開 URL
 */
const uploadFileToBucket = async (file) => {
  if (!bucket) {
    throw new Error('GCP Storage 尚未設定，請檢查環境變數');
  }
  
  if (!file) {
    throw new Error('未提供檔案');
  }

  // 產生唯一檔名避免覆蓋
  const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const ext = path.extname(file.originalname);
  const filename = `${uniquePrefix}${ext}`;

  const blob = bucket.file(filename);

  return new Promise((resolve, reject) => {
    const blobStream = blob.createWriteStream({
      resumable: false,
      contentType: file.mimetype,
    });

    blobStream.on('error', (err) => {
      reject(new Error(`檔案上傳失敗: ${err.message}`));
    });

    blobStream.on('finish', () => {
      // 若您的 Bucket 未完全公開，可能需要呼叫 blob.makePublic()
      // 此處預設您的 Bucket 已經設定了公開讀取權限 (allUsers -> Storage Object Viewer)
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
      resolve(publicUrl);
    });

    // 將記憶體中的 buffer 寫入 stream
    blobStream.end(file.buffer);
  });
};

module.exports = {
  uploadFileToBucket
};
