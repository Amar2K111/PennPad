import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  console.log('🚀 AI REWRITE API ENDPOINT CALLED!');
  
  try {
    const body = await request.json();
    console.log('📥 Request body:', body);
    
    const { text, instruction } = body;
    
    console.log('📝 Original text:', text);
    console.log('🎯 Rewrite instruction:', instruction);
    
    if (!text || !instruction) {
      console.log('❌ Missing required fields');
      return NextResponse.json(
        { error: 'Missing text or instruction' },
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

    console.log('🤖 Calling OpenAI API...');
    
    const prompt = `CRITICAL INSTRUCTIONS: You must rewrite the following text according to this instruction: "${instruction}"

STRICT REQUIREMENTS:
1. MAINTAIN EXACT SAME STRUCTURE - Keep every paragraph break, line break, and formatting exactly as original
2. PRESERVE FLOW - Do not reorganize, restructure, or change the order of ideas
3. KEEP SAME LENGTH - Maintain similar word count and sentence structure
4. FINISH CURRENT LINE - Complete any incomplete sentences naturally
5. CONTINUE TO NEXT LINE - Follow the exact same line-by-line progression
6. NO RESTRUCTURING - Do not change paragraph organization or overall layout
7. ONLY IMPROVE WORDING - Fix grammar, spelling, and clarity while keeping same meaning
8. RESPECT FORMATTING - Preserve any special formatting, indentation, or spacing

Original text:
"${text}"

REWRITE THE TEXT FOLLOWING ALL REQUIREMENTS ABOVE. MAINTAIN EXACT STRUCTURE AND FORMATTING.`;

    console.log('📋 Prompt sent to OpenAI:', prompt);

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a STRUCTURE-PRESERVING writing assistant. Your PRIMARY GOAL is to maintain the EXACT SAME structure, formatting, and flow as the original text. You MUST: 1) Keep every paragraph break and line break exactly as original, 2) Preserve the exact order and flow of ideas, 3) Maintain similar sentence structure and length, 4) Only improve grammar, spelling, and clarity, 5) NEVER reorganize or restructure the content. The user\'s original structure is SACRED - do not change it under any circumstances.'
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

    const rewrittenText = completion.choices[0]?.message?.content?.trim();

    if (!rewrittenText) {
      console.log('❌ No rewritten text in OpenAI response');
      return NextResponse.json(
        { error: 'Failed to generate rewritten text' },
        { status: 500 }
      );
    }

    console.log('✅ Successfully generated rewritten text');
    console.log('🔄 Rewritten text:', rewrittenText);

    return NextResponse.json({
      rewrittenText,
      originalText: text,
      instruction: instruction
    });

  } catch (error) {
    console.log('💥 Error in AI rewrite API:', error);
    console.log('🔍 Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });

    return NextResponse.json(
      { error: 'Failed to rewrite text' },
      { status: 500 }
    );
  }
} 