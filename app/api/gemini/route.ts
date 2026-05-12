import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { prompt, pdf } = await req.json();
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'No API key', text: '' });
  }

  // Construire le contenu du message avec ou sans PDF
  let messageContent: unknown;
  if (pdf) {
    messageContent = [
      {
        type: 'document',
        source: {
          type: 'base64',
          media_type: 'application/pdf',
          data: pdf,
        }
      },
      {
        type: 'text',
        text: prompt
      }
    ];
  } else {
    messageContent = prompt;
  }

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://pacepro-virid.vercel.app',
    },
    body: JSON.stringify({
      model: pdf ? 'anthropic/claude-3-5-sonnet' : 'anthropic/claude-3-5-haiku',
      messages: [{ role: 'user', content: messageContent }],
      max_tokens: 12000,
    })
  });

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || '';
  return NextResponse.json({ text });
}
