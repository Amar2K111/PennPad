import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  console.log('🚀 AI TONE CHANGE API ENDPOINT CALLED!');
  
  try {
    const body = await request.json();
    console.log('📥 Request body:', body);
    
    const { text, tone } = body;
    
    console.log('📝 Original text:', text);
    console.log('🎭 New tone:', tone);
    
    if (!text || !tone) {
      console.log('❌ Missing required fields');
      return NextResponse.json(
        { error: 'Missing text or tone' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      console.log('❌ No OpenAI API key configured');
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    console.log('🤖 Calling OpenAI API for tone change...');
    
    const prompt = `Please change the tone of the following text to ${tone.toLowerCase()}.

Original text:
"${text}"

Please provide only the text with the new tone without any additional explanations or formatting.`;

    console.log('📋 Prompt sent to OpenAI:', prompt);

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful writing assistant. Change the tone of the given text according to the user\'s specifications. Provide only the text with the new tone without any explanations or additional formatting.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    console.log('✅ OpenAI response received');
    console.log('📄 Response content:', completion.choices[0]?.message?.content);

    const toneChangedText = completion.choices[0]?.message?.content?.trim();

    if (!toneChangedText) {
      console.log('❌ No tone-changed text in OpenAI response');
      return NextResponse.json(
        { error: 'Failed to generate tone-changed text' },
        { status: 500 }
      );
    }

    console.log('✅ Successfully generated tone-changed text');
    console.log('🔄 Tone-changed text:', toneChangedText);

    return NextResponse.json({
      toneChangedText,
      originalText: text,
      tone: tone
    });

  } catch (error) {
    console.log('💥 Error in AI tone change API:', error);
    console.log('🔍 Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });

    return NextResponse.json(
      { error: 'Failed to change tone' },
      { status: 500 }
    );
  }
} 