import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // On récupère des paramètres de test depuis l'URL
    const distance = searchParams.get('distance') || '0';
    const temps = searchParams.get('temps') || '--:--';
    const allure = searchParams.get('allure') || '--:--';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#09090b', // Noir zinc-950
            color: 'white',
            fontFamily: 'sans-serif',
          }}
        >
          {/* Logo PacePro */}
          <div style={{ display: 'flex', position: 'absolute', top: 40, left: 40 }}>
            <span style={{ fontSize: 32, fontWeight: 'bold', color: '#3b82f6' }}>PacePro</span>
          </div>

          {/* Contenu Principal */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: 120, fontWeight: 'bold', marginBottom: 20 }}>
              {distance} <span style={{ fontSize: 40, color: '#71717a' }}>km</span>
            </div>
            
            <div style={{ display: 'flex', gap: 60, marginTop: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: 24, color: '#71717a', textTransform: 'uppercase' }}>Temps</span>
                <span style={{ fontSize: 48, fontWeight: 'bold' }}>{temps}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: 24, color: '#71717a', textTransform: 'uppercase' }}>Allure</span>
                <span style={{ fontSize: 48, fontWeight: 'bold', color: '#3b82f6' }}>{allure}</span>
              </div>
            </div>
          </div>

          <div style={{ position: 'absolute', bottom: 40, color: '#3f3f46', fontSize: 20 }}>
            pacepro-virid.vercel.app
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    return new Response(`Failed to generate image`, { status: 500 });
  }
}