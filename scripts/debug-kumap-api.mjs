// くまっぷAPIのレスポンス構造を確認するデバッグスクリプト

const KUMAP_BASE_URL = "https://xgzsccaaaxadvzzsztde.supabase.co/functions/v1";
const apiKey = process.env.KUMAP_API_KEY;

async function debugKumapApi() {
  console.log("=== くまっぷAPI デバッグ ===");
  console.log("API Key:", apiKey ? `${apiKey.substring(0, 20)}...` : "NOT SET");
  
  try {
    const response = await fetch(`${KUMAP_BASE_URL}/api-points-list`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        limit: 5,
        offset: 0,
        status: "active",
      }),
    });

    console.log("\nResponse Status:", response.status, response.statusText);
    
    const data = await response.json();
    console.log("\nResponse Structure:");
    console.log("Keys:", Object.keys(data));
    console.log("\nFull Response (first 5 items):");
    console.log(JSON.stringify(data, null, 2));
    
    if (Array.isArray(data)) {
      console.log("\nResponse is an array with", data.length, "items");
      if (data.length > 0) {
        console.log("\nFirst item structure:");
        console.log("Keys:", Object.keys(data[0]));
        console.log(JSON.stringify(data[0], null, 2));
      }
    } else if (data.data) {
      console.log("\nResponse has 'data' property with", data.data.length, "items");
      if (data.data.length > 0) {
        console.log("\nFirst item structure:");
        console.log("Keys:", Object.keys(data.data[0]));
        console.log(JSON.stringify(data.data[0], null, 2));
      }
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

debugKumapApi();
