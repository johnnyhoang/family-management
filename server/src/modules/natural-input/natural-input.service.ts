import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import * as dayjs from 'dayjs';
import { CategoryService } from '../category/category.service';
import { UserService } from '../user/user.service';
import { AssetService } from '../asset/asset.service';
import { MoneyParserService } from './money-parser.service';

@Injectable()
export class NaturalInputService {
  private openai: OpenAI;

  constructor(
    private configService: ConfigService,
    private categoryService: CategoryService,
    private userService: UserService,
    private assetService: AssetService,
    private moneyParser: MoneyParserService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.openai = new OpenAI({
      apiKey: apiKey || 'dummy-key',
    });
  }

  async parse(message: string, familyId: string) {
    if (!this.configService.get('OPENAI_API_KEY')) {
      return { success: false, reason: 'openai_api_key_missing' };
    }

    // 1. Vietnamese Money Parsing (Heuristic)
    const normalizedMessage = this.moneyParser.normalizeText(message);

    // 2. Fetch Context
    const [categories, users, assets] = await Promise.all([
      this.categoryService.findAll(familyId),
      this.userService.findAll(familyId),
      this.assetService.findAll(familyId),
    ]);

    const context = {
      categories: categories.map(c => ({ id: c.id, name: c.name, type: c.type })),
      familyMembers: users.map(u => ({ id: u.id, name: u.fullName || u.email })),
      assets: assets.map(a => ({ id: a.id, name: a.name, category: a.category?.name })),
      currentDate: dayjs().format('YYYY-MM-DD'),
      currentTime: dayjs().format('HH:mm:ss'),
      dayOfWeek: dayjs().format('dddd'),
    };

    const systemPrompt = `
You are an AI Natural Input Engine for a personal management app.
Convert the user's Vietnamese natural language input into structured JSON.

### DB CONTEXT:
- Categories: ${JSON.stringify(context.categories)}
- Family Members: ${JSON.stringify(context.familyMembers)}
- Existing Assets: ${JSON.stringify(context.assets)}
- Current Date: ${context.currentDate} (${context.dayOfWeek})

### SUPPORTED INTENTS:
- create_expense: For payments, shopping, bills.
- create_income: For salary, gifts, received money.
- create_asset: For buying new items (vehicles, electronics, etc.).
- update_asset: For maintenance or status changes of existing assets.
- create_event: For calendar events, appointments.
- create_task: For reminders or to-do items.
- create_note: For general information to remember.

### SCHEMA RULES:
- amount: number (normalize Vietnamese expressions like '4 triệu 365 ngàn' -> 4365000, '2tr5' -> 2500000).
- currency: default 'VND'.
- date: YYYY-MM-DD.
- category: Map to the ID of the closest matching category from the provided context. If no match, provide a string name.
- owner: Map to the ID or Name of the family member mentioned (chồng, vợ, con, etc.).
- account: Bank name or account mentioned (HSBC, Techcom, etc.).

### RESPONSE FORMAT (MUST BE STRICT JSON):
{
  "intent": "intent_name",
  "confidence": 0.0 to 1.0,
  "data": { ... fields relevant to entity ... },
  "clarification": "Only if intent is 'unknown' or info is missing"
}

### EXAMPLES:
Input: "Hôm nay thanh toán thẻ HSBC của chồng 4 triệu 3 trăm 65 ngàn"
Output: {
  "intent": "create_expense",
  "confidence": 0.95,
  "data": {
    "amount": 4365000,
    "currency": "VND",
    "category": "credit_card_payment",
    "account": "HSBC",
    "owner": "chồng",
    "date": "${context.currentDate}",
    "description": "Thanh toán thẻ HSBC"
  }
}
`;

    return this.callOpenAIWithRetry(systemPrompt, normalizedMessage);
  }

  private async callOpenAIWithRetry(systemPrompt: string, userMessage: string, retries = 1) {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0].message.content;
      if (!content) throw new Error('Empty response');

      const result = JSON.parse(content);
      
      // Log for improvement and fine-tuning
      console.log(`[AI Parser] Input: "${userMessage}" | Intent: ${result.intent} | Confidence: ${result.confidence}`);
      if (result.intent === 'unknown') console.log(`[AI Parser] Clarification: ${result.clarification}`);

      // Auto-fix amount using MoneyParser if AI looks uncertain or for double-check
      if (result.data?.amount && typeof result.data.amount === 'string') {
        result.data.amount = this.moneyParser.parse(result.data.amount) || result.data.amount;
      }

      return {
        success: true,
        ...result,
      };
    } catch (error) {
      if (retries > 0) {
        console.warn(`OpenAI call failed, retrying... (${retries} left)`);
        return this.callOpenAIWithRetry(systemPrompt, userMessage, retries - 1);
      }
      console.error('Final OpenAI error:', error);
      return {
        success: false,
        reason: 'intent_not_detected',
        details: error.message,
      };
    }
  }
}
