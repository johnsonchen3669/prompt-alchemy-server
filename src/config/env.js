require('dotenv').config();

module.exports = {
  port: Number(process.env.PORT) || 3000,
  gcp: {
    projectId: process.env.GCP_PROJECT_ID,
    clientEmail: process.env.GCP_CLIENT_EMAIL,
    privateKey: process.env.GCP_PRIVATE_KEY,
    bucketName: process.env.GCP_BUCKET_NAME,
  }
}