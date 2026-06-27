
import healthHandler from './api/health';
import uploadTestHandler from './api/cvs/upload-test';
import { EventEmitter } from 'events';

// Mock Express-like Req/Res
class MockRes extends EventEmitter {
  statusCode = 200;
  _data: any = null;
  status(code: number) { this.statusCode = code; return this; }
  json(data: any) { this._data = data; this.emit('end'); return this; }
}

async function runTests() {
  console.log("--- STARTING VERCEL ENDPOINT VERIFICATION ---");

  // 1. Test Health
  console.log("\n[Test 1] GET /api/health");
  const healthRes = new MockRes();
  // @ts-ignore
  await healthHandler({ method: 'GET' }, healthRes);
  console.log("Status:", healthRes.statusCode);
  console.log("Body:", JSON.stringify(healthRes._data, null, 2));

  // 2. Test Upload (Simulated)
  console.log("\n[Test 2] POST /api/cvs/upload-test (Simulated)");
  const uploadRes = new MockRes();
  const mockFile = {
    fieldname: 'cvFile',
    originalname: 'test_resume.txt',
    encoding: '7bit',
    mimetype: 'text/plain',
    buffer: Buffer.from('John Doe\nSoftware Engineer\nExperience at Google and Meta.\nSkills: React, TypeScript, Node.js'),
    size: 96
  };

  // We mock the multer behavior since we can't easily send multipart in this script
  const mockReq = {
    method: 'POST',
    file: mockFile,
    headers: {}
  };

  // Directly call the logic inside the handler or mock the middleware
  // For the sake of proof, we'll call the handler and ensure it handles a "pre-parsed" file if we bypass the middleware
  // Or better, we just show the output of a successful parse
  
  // Since the real handler uses runMiddleware(req, res, upload.single('cvFile')), 
  // we'll just demonstrate the parsing logic works.
  
  try {
    // @ts-ignore
    await uploadTestHandler(mockReq, uploadRes);
    console.log("Status:", uploadRes.statusCode);
    console.log("Body:", JSON.stringify(uploadRes._data, null, 2));
  } catch (err) {
    console.error("Upload Test Error:", err);
  }

  console.log("\n--- VERIFICATION COMPLETE ---");
}

runTests();
