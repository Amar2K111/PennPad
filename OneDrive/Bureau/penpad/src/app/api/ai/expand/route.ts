import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  console.log('🚀 AI EXPAND API ENDPOINT CALLED!');
  
  try {
    const body = await request.json();
    console.log('📥 Request body:', body);
    
    const { text, amount, option } = body;
    
    console.log('📝 Original text:', text);
    console.log('📏 Expand amount:', amount);
    console.log('🎯 Expand option:', option);
    
    if (!text || !amount || !option) {
      console.log('❌ Missing required fields');
      return NextResponse.json(
        { error: 'Missing text, amount, or option' },
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

    console.log('🤖 Calling OpenAI API for expansion...');
    
    const prompt = `Please expand the following text by ${amount.toLowerCase()} amount, focusing on ${option.toLowerCase()}.

Original text:
"${text}"

Please provide only the expanded text without any additional explanations or formatting.`;

    console.log('📋 Prompt sent to OpenAI:', prompt);

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful writing assistant. Expand the given text according to the user\'s specifications. Provide only the expanded text without any explanations or additional formatting.'
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

    const expandedText = completion.choices[0]?.message?.content?.trim();

    if (!expandedText) {
      console.log('❌ No expanded text in OpenAI response');
      return NextResponse.json(
        { error: 'Failed to generate expanded text' },
        { status: 500 }
      );
    }

    console.log('✅ Successfully generated expanded text');
    console.log('🔄 Expanded text:', expandedText);

    return NextResponse.json({
      expandedText,
      originalText: text,
      amount: amount,
      option: option
    });

  } catch (error) {
    console.log('💥 Error in AI expand API:', error);
    console.log('🔍 Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });

    return NextResponse.json(
      { error: 'Failed to expand text' },
      { status: 500 }
    );
  }
} 