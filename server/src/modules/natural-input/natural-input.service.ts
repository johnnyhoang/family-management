import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import * as dayjs from 'dayjs';
import { CategoryService } from '../category/category.service';
import { UserService } from '../user/user.service';
import { AssetService } from '../asset/asset.service';
import { MoneyParserService } from './money-parser.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NaturalInputHistory } from './entities/natural-input-history.entity';

@Injectable()
export class NaturalInputService {
  private openai: OpenAI;
  private contextCache: { [familyId: string]: { data: any, expires: number } } = {};
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(
    private configService: ConfigService,
    private categoryService: CategoryService,
    private userService: UserService,
    private assetService: AssetService,
    private moneyParser: MoneyParserService,
    @InjectRepository(NaturalInputHistory)
    private historyRepository: Repository<NaturalInputHistory>,
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
    const context = await this.getParsedContext(familyId);
    const result = await this.callOpenAIWithRetry(this.getSystemPrompt(context), normalizedMessage);

    // 3. Save to history (if successful parse)
    if (result.success) {
      await this.historyRepository.save({
        familyId,
        userId: context.familyMembers.find(u => u.id === context.familyMembers[0].id)?.id, // Temporary fallback or need to pass userId
        inputMessage: message,
        intent: result.intent,
        confidence: result.confidence,
        resultData: result.data,
      });
    }

    return result;
  }

  // Refactored to accept userId
  async parseWithUser(message: string, familyId: string, userId: string) {
    if (!this.configService.get('OPENAI_API_KEY')) {
      return { success: false, reason: 'openai_api_key_missing' };
    }

    const normalizedMessage = this.moneyParser.normalizeText(message);

    const context = await this.getParsedContext(familyId);
    const result = await this.callOpenAIWithRetry(this.getSystemPrompt(context), normalizedMessage);

    await this.historyRepository.save({
      familyId,
      userId,
      inputMessage: message,
      intent: result.intent,
      confidence: result.confidence,
      resultData: result.data,
    });

    return result;
  }

  async getHistory(familyId: string, limit = 20) {
    return this.historyRepository.find({
      where: { familyId },
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['user'],
    });
  }

  private async getParsedContext(familyId: string) {
    const cached = this.contextCache[familyId];
    if (cached && cached.expires > Date.now()) {
      return {
        ...cached.data,
        currentDate: dayjs().format('YYYY-MM-DD'),
        currentTime: dayjs().format('HH:mm:ss'),
        dayOfWeek: dayjs().format('dddd'),
      };
    }

    const [categories, users, assets] = await Promise.all([
      this.categoryService.findAll(familyId),
      this.userService.findAll(familyId),
      this.assetService.findAll(familyId),
    ]);

    const data = {
      categories: categories.map(c => ({ id: c.id, name: c.name, type: c.type })),
      familyMembers: users.map(u => ({ 
        id: u.id, 
        name: u.fullName, 
        aliases: u.otherNames ? u.otherNames.split(',').map(n => n.trim()) : [],
        email: u.email 
      })),
      assets: assets.map(a => ({ id: a.id, name: a.name, category: a.category?.name })),
    };

    this.contextCache[familyId] = {
      data,
      expires: Date.now() + this.CACHE_TTL,
    };

    return {
      ...data,
      currentDate: dayjs().format('YYYY-MM-DD'),
      currentTime: dayjs().format('HH:mm:ss'),
      dayOfWeek: dayjs().format('dddd'),
    };
  }

  private getSystemPrompt(context: any) {
    return `
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
- amount: number (For expenses/incomes).
- purchasePrice: number (For create_asset).
- categoryId: Map to the ID of the closest matching category from the provided context.
- ownerId: The ID of the person who legally owns/stands name on the asset (e.g., 'xe của Khôi').
  - IMPORTANT: Use ONLY the 'id' from the provided 'Family Members' context.
- usedById: The ID of the person who actually uses the asset (e.g., 'xe Khôi đi').
  - IMPORTANT: Use ONLY the 'id' from the provided 'Family Members' context.
- assignedToUserId: The ID of the primary person responsible (DEPRECATED, use ownerId/usedById if possible).
- assetId: The ID of the existing asset mentioned.
- recurrenceRule: For events/tasks. Options: 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'. (Detect from words like 'mỗi ngày', 'hàng tuần', 'lặp lại').
- participantIds: Array of IDs of family members involved or mentioned (e.g., 'nhắc cả nhà', 'cho Khuyên và Khôi').
- reminderMinutes: Number of minutes before the event to notify.

### RESPONSE FORMAT (MUST BE STRICT JSON):
{
  "intent": "intent_name",
  "confidence": 0.0 to 1.0,
  "data": { ... fields relevant to entity ... },
  "clarification": "Only if intent is 'unknown' or info is missing"
}

### EXAMPLES:
Input: "Ngày mai đi bảo dưỡng xe SYM của Khôi"
Output: {
  "intent": "update_asset",
  "confidence": 0.9,
  "data": {
    "name": "xe SYM",
    "description": "Bảo dưỡng xe SYM",
    "expenseDate": "${dayjs().add(1, 'day').format('YYYY-MM-DD')}",
    "ownerId": "7b098162-8e39-4f81-9964-6729359e1903",
    "assetId": "550e8400-e29b-41d4-a716-446655440000"
  }
}

Input: "Mua xe SH đứng tên Khôi cho Khuyên đi"
Output: {
  "intent": "create_asset",
  "confidence": 0.95,
  "data": {
    "name": "xe SH",
    "purchasePrice": 120000000,
    "purchaseDate": "${dayjs().format('YYYY-MM-DD')}",
    "ownerId": "7b098162-8e39-4f81-9964-6729359e1903",
    "usedById": "f33e6ace-1ee1-4b3d-975f-de09344f28cb"
  }
}

Input: "Nhắc cả nhà đi ăn tối lúc 7h tối mai lặp lại hàng tuần"
Output: {
  "intent": "create_event",
  "confidence": 0.9,
  "data": {
    "title": "Đi ăn tối cả nhà",
    "date": "${dayjs().add(1, 'day').format('YYYY-MM-DD')}",
    "time": "19:00",
    "recurrenceRule": "WEEKLY",
    "participantIds": ["7b098162-8e39-4f81-9964-6729359e1903", "f33e6ace-1ee1-4b3d-975f-de09344f28cb"]
  }
}
`;
  }

  private async callOpenAIWithRetry(systemPrompt: string, userMessage: string, retries = 1) {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
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
