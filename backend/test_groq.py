import os
import json
import urllib.request
import urllib.error

def load_env_file():
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    os.environ[k.strip()] = v.strip().strip("'").strip('"')

load_env_file()

def test_groq():
    apiKey = os.getenv("GROQ_API_KEY")
    print(f"Loaded GROQ_API_KEY: {apiKey[:10]}...{apiKey[-10:] if apiKey else ''}")
    
    if not apiKey or "your_key" in apiKey:
        print("Error: The GROQ_API_KEY in backend/.env is still the default placeholder!")
        return

    DEFAULT_MODEL = "llama-3.3-70b-versatile"
    API_URL = "https://api.groq.com/openai/v1/chat/completions"

    payload = {
        "model": DEFAULT_MODEL,
        "messages": [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Hello, respond with exactly 'Groq is active!'"}
        ],
        "temperature": 0.2,
        "max_tokens": 1024
    }
    
    req = urllib.request.Request(
        API_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {apiKey}",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
        method="POST"
    )
    
    try:
        print("Sending request to Groq API...")
        with urllib.request.urlopen(req, timeout=12) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            print("\n--- SUCCESS ---")
            print("Response:", res_data["choices"][0]["message"]["content"])
    except urllib.error.HTTPError as e:
        print("\n--- HTTP ERROR ---")
        print(f"Status Code: {e.code}")
        try:
            error_body = e.read().decode("utf-8")
            print("Error Details from Groq:", error_body)
        except Exception:
            print("Could not read error body.")
    except Exception as e:
        print("\n--- SYSTEM ERROR ---")
        print("General Exception:", str(e))

if __name__ == "__main__":
    test_groq()
