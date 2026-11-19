import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { beforeAll, afterAll, afterEach } from 'vitest';

let mongoServer;

// Set at module load (before test files import the app) so nothing reads real values from .env.
// Tests must never talk to production services: ERP runs in mock mode.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret';
process.env.ERP_API_KEY = 'test_erp_api_key';
process.env.ADMIN_GATEWAY_TOKEN = 'test_admin_gateway_token';
process.env.ERP_MODE = 'mock';

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  
  // Set test environment variables
  process.env.JWT_SECRET = 'test_jwt_secret';
  process.env.R2_BUCKET_NAME = 'test_bucket';
  process.env.CLOUDINARY_API_KEY = 'test_cloudinary_key';
  process.env.MONGODB_URI = uri;
  process.env.NODE_ENV = 'test';

  await mongoose.connect(uri);
}, 45000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
}, 45000);

afterEach(async () => {
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }
});
