
async function test() {
  console.log("Testing POST /api/cvs/upload...");
  try {
    const res = await fetch('http://localhost:3000/api/cvs/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: true })
    });
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Response Body:", JSON.stringify(data, null, 2));
  } catch (err: any) {
    console.error("Error:", err.message);
  }
}

test();
