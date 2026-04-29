import { readFileSync } from 'fs';

// Load .env.local
const envContent = readFileSync('.env.local', 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIndex = trimmed.indexOf('=');
  if (eqIndex === -1) continue;
  env[trimmed.slice(0, eqIndex)] = trimmed.slice(eqIndex + 1);
}

const { OPENAI_API_KEY, OPENAI_BASE_URL, OPENAI_MODEL } = env;

console.log('=== LLM Connection Test ===\n');
console.log(`API Key:    ${OPENAI_API_KEY ? OPENAI_API_KEY.slice(0, 8) + '...' : '(missing)'}`);
console.log(`Base URL:   ${OPENAI_BASE_URL || '(missing)'}`);
console.log(`Model:      ${OPENAI_MODEL || '(missing)'}`);
console.log();

if (!OPENAI_API_KEY || !OPENAI_BASE_URL || !OPENAI_MODEL) {
  console.error('❌ Missing env vars, check .env.local');
  process.exit(1);
}

const url = `${OPENAI_BASE_URL}/chat/completions`;

console.log(`Request: POST ${url}\n`);

try {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: '你是德州扑克AI。返回JSON格式：{"action":"CHECK|FOLD|CALL|RAISE","reason":"理由"}' },
        { role: 'user', content: '手牌：A♠ K♠，公共牌：无，底池100，当前下注0，筹码1000。请决策。' },
      ],
      temperature: 0.7,
      max_tokens: 500,
    }),
  });

  console.log(`Status: ${res.status} ${res.statusText}\n`);

  const data = await res.json();

  if (data.error) {
    console.error('❌ API Error:', JSON.stringify(data.error, null, 2));
    process.exit(1);
  }

  const content = data.choices?.[0]?.message?.content;
  console.log('Response content:', content);

  // Try parse as JSON
  try {
    const parsed = JSON.parse(content);
    console.log('\n✅ LLM returned valid JSON:');
    console.log(`   action: ${parsed.action}`);
    console.log(`   reason: ${parsed.reason}`);
    console.log('\n🎉 All good! LLM connection works.');
  } catch {
    console.log('\n⚠️  LLM responded but content is not valid JSON');
  }
} catch (err) {
  console.error('❌ Connection failed:', err.message);
  process.exit(1);
}
