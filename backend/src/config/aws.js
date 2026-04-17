const AWS = require("aws-sdk");
require("dotenv").config();

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3({
  region: process.env.AWS_S3_REGION,
  signatureVersion: "v4",
});

const uploadToS3 = async (fileBuffer, fileName, mimeType) => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: `reports/${Date.now()}-${fileName}`,
    Body: fileBuffer,
    ContentType: mimeType,
    ACL: "public-read",
  };

  try {
    const result = await s3.upload(params).promise();
    return result.Location;
  } catch (error) {
    console.error("S3 upload error:", error);
    throw error;
  }
};

const deleteFromS3 = async (fileUrl) => {
  try {
    const key = fileUrl.split("/").slice(-2).join("/");
    await s3
      .deleteObject({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
      })
      .promise();
  } catch (error) {
    console.error("S3 delete error:", error);
  }
};

module.exports = {
  s3,
  uploadToS3,
  deleteFromS3,
};
