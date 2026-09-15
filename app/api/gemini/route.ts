import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { prompt, pdf } = await req.json();
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'No API key', text: '' });
  }

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://pacepro-virid.vercel.app',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3.5-haiku',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 12000,
    })
  });

  const data = await res.json();

  if (!res.ok || data.error) {
    return NextResponse.json({ text: '', error: data.error?.message || `OpenRouter error (${res.status})` });
  }

  const text = data.choices?.[0]?.message?.content || '';
  if (!text) {
    return NextResponse.json({ text: '', error: 'Réponse vide du modèle' });
  }
  return NextResponse.json({ text });
}
