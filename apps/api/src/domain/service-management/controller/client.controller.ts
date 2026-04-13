import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ClientService } from '../service/client.service';
import { CreateClientRequest } from '../dto/request/create-client.request';
import { UpdateClientRequest } from '../dto/request/update-client.request';
import { CreateClientNoteRequest } from '../dto/request/create-client-note.request';

@ApiTags('Service Management - Clients')
@ApiBearerAuth()
@Controller('service/clients')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Get()
  @ApiOperation({ summary: '고객사 목록 조회' })
  async findAll(@Query() query: any) {
    const data = await this.clientService.findAll(query);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get(':id')
  @ApiOperation({ summary: '고객사 상세 조회' })
  async findById(@Param('id') id: string) {
    const data = await this.clientService.findById(id);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post()
  @ApiOperation({ summary: '고객사 등록' })
  async create(@Body() dto: CreateClientRequest) {
    const data = await this.clientService.create(dto);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch(':id')
  @ApiOperation({ summary: '고객사 수정' })
  async update(@Param('id') id: string, @Body() dto: UpdateClientRequest) {
    const data = await this.clientService.update(id, dto);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete(':id')
  @ApiOperation({ summary: '고객사 삭제' })
  async remove(@Param('id') id: string) {
    await this.clientService.delete(id);
    return { success: true, timestamp: new Date().toISOString() };
  }

  // Contacts
  @Get(':id/contacts')
  @ApiOperation({ summary: '담당자 목록' })
  async findContacts(@Param('id') id: string) {
    const data = await this.clientService.findContacts(id);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post(':id/contacts')
  @ApiOperation({ summary: '담당자 추가' })
  async createContact(@Param('id') id: string, @Body() body: any) {
    const data = await this.clientService.createContact(id, body);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch(':id/contacts/:contactId')
  @ApiOperation({ summary: '담당자 수정' })
  async updateContact(@Param('id') id: string, @Param('contactId') contactId: string, @Body() body: any) {
    const data = await this.clientService.updateContact(id, contactId, body);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete(':id/contacts/:contactId')
  @ApiOperation({ summary: '담당자 삭제' })
  async deleteContact(@Param('id') id: string, @Param('contactId') contactId: string) {
    await this.clientService.deleteContact(id, contactId);
    return { success: true, timestamp: new Date().toISOString() };
  }

  // Notes
  @Get(':id/notes')
  @ApiOperation({ summary: '고객 메모 목록' })
  async findNotes(@Param('id') id: string) {
    const data = await this.clientService.findNotes(id);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post(':id/notes')
  @ApiOperation({ summary: '고객 메모 추가' })
  async createNote(@Param('id') id: string, @Body() dto: CreateClientNoteRequest, @Req() req: any) {
    const data = await this.clientService.createNote(id, dto, req.user.userId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch(':id/notes/:noteId')
  @ApiOperation({ summary: '고객 메모 수정' })
  async updateNote(@Param('id') id: string, @Param('noteId') noteId: string, @Body() body: any) {
    const data = await this.clientService.updateNote(id, noteId, body);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete(':id/notes/:noteId')
  @ApiOperation({ summary: '고객 메모 삭제' })
  async deleteNote(@Param('id') id: string, @Param('noteId') noteId: string) {
    await this.clientService.deleteNote(id, noteId);
    return { success: true, timestamp: new Date().toISOString() };
  }
}
