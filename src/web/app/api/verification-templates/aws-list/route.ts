import { NextResponse } from 'next/server';
import { listRemoteVerificationTemplates } from '@/lib/aws';

export async function GET() {
  try {
    const templates = await listRemoteVerificationTemplates();
    
    return NextResponse.json({
      templates,
      count: templates.length
    });
  } catch (error: unknown) {
    console.error('Erro ao buscar templates da AWS:', error);
    return NextResponse.json(
      { 
        error: 'Falha ao buscar templates da AWS.', 
        details: (error as { message: string; }).message 
      }, 
      { status: 500 }
    );
  }
}
