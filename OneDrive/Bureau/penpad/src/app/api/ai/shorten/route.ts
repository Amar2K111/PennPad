import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  console.log('🚀 AI SHORTEN API ENDPOINT CALLED!');
  
  try {
    const body = await request.json();
    console.log('📥 Request body:', body);
    
    const { text, option } = body;
    
    console.log('📝 Original text:', text);
    console.log('🎯 Shorten option:', option);
    
    if (!text || !option) {
      console.log('❌ Missing required fields');
      return NextResponse.json(
        { error: 'Missing text or option' },
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

    console.log('🤖 Calling OpenAI API for shortening...');
    
    const prompt = `Please shorten the following text by ${option.toLowerCase()}.

Original text:
"${text}"

Please provide only the shortened text without any additional explanations or formatting.`;

    console.log('📋 Prompt sent to OpenAI:', prompt);

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful writing assistant. Shorten the given text according to the user\'s specifications. Provide only the shortened text without any explanations or additional formatting.'
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

    const shortenedText = completion.choices[0]?.message?.content?.trim();

    if (!shortenedText) {
      console.log('❌ No shortened text in OpenAI response');
      return NextResponse.json(
        { error: 'Failed to generate shortened text' },
        { status: 500 }
      );
    }

    console.log('✅ Successfully generated shortened text');
    console.log('🔄 Shortened text:', shortenedText);

    return NextResponse.json({
      shortenedText,
      originalText: text,
      option: option
    });

  } catch (error) {
    console.log('💥 Error in AI shorten API:', error);
    console.log('🔍 Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });

    return NextResponse.json(
      { error: 'Failed to shorten text' },
      { status: 500 }
    );
  }
} 