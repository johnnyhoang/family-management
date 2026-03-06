import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { NaturalInputService } from './natural-input.service';

@ApiTags('Natural Input')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('natural-input')
export class NaturalInputController {
  constructor(private readonly naturalInputService: NaturalInputService) {}

  @Post('parse')
  @ApiOperation({ summary: 'Parse natural Vietnamese language input' })
  async parse(@Req() req, @Body() body: { message: string }) {
    return this.naturalInputService.parse(body.message, req.user.familyId);
  }
}
