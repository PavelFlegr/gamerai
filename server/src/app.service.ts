import { Body, Controller, Get, Injectable, OnModuleInit, Post } from '@nestjs/common';
import { Configuration, OpenAIApi } from 'openai';
import { format } from 'date-fns';
import got from 'got';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import { Message } from './message.model.js';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import * as process from 'process';

const actionParser = /(browse|scroll])\((.*)\)/gi

@Injectable()
export class AppService implements OnModuleInit {
  openai: OpenAIApi
  memory: string = ''
  logs: Message[] = []
  buffer: string = ''
  bufferIndex = 0

  constructor(private eventEmitter: EventEmitter2) {  }

  @OnEvent('message')
  async handleAIMessage(message: Message) {
    console.log(message)
    this.logs.push(message)
    await this.processActions(message.text)
  }

//  template() {
//    return `
//info:
//${format(new Date(), 'dd.MM.yyyy hh:mm')}
//
//logs:
//${this.logs.slice(-5).map(msg => `${msg.author}: ${msg.text}`).join('\n')}
//
//memory:
//${this.memory}
//
//buffer (chars ${this.bufferIndex} to ${this.bufferIndex + 500} of ${this.buffer.length}):
//${this.buffer.slice(this.bufferIndex, this.bufferIndex + 500)}
//
//commands:
//save(data) - overwrite memory
//wait(minutes) - do nothing
//write(file, data) - write to a file
//read(file) - read a file
//files() - list all created file names
//browse(url) - read the website content to your buffer. scroll through to see more
//scroll(chars) - scroll down the buffer
//
//You are an AI assistant. Use the information and commands (use them the same way you would call a javascript function) you see listed above to help the user
//You can visit websites
//You won't always see the full context - use your memory to remember what you're trying to do and the scroll function to see other parts of the data you are viewing
//You can also write useful data in a file to retrieve it later`
//  }
  template() {
    return `
info:
${format(new Date(), 'dd.MM.yyyy hh:mm')}

logy:
${this.logs.slice(-5).map(msg => `${msg.author}: ${msg.text}`).join('\n')}

paměť:
${this.memory}

buffer:
${this.buffer.slice(this.bufferIndex, this.bufferIndex + 500)}

nástroje:
save(data) - overwrite memory
wait(minutes) - do nothing
write(file, data) - write to a file
read(file) - read a file
files() - list all created file names
browse(url) - read the website content to your buffer. scroll through to see more 
scroll(chars) - scroll down the buffer

Jsem AI asistent. mám dostupné informace a nástroje (v podobě funkcí, např. browse("http://google.com"), save("information") nebo scroll(200))
Mám omezený kontext a bude třeba využít paměť a scroll
Pro dlouhodobé uložení dat můžu použít zápis a čtení do souboru`
  }

  onModuleInit() {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_KEY,
    });
    this.openai = new OpenAIApi(configuration)
  }

  async processActions(message: string) {
    const actions = message.matchAll(actionParser)
    for(const action of actions) {
      const name = action[1]
      const args = action[2]
      switch (name) {
        case 'browse':
          const url = JSON.parse(args.replace(/'/g, '"'))
          const data = await got.get(url).text()
          const doc = new JSDOM(data, { url: url })
          const article = new Readability(doc.window.document).parse()
          console.log(article.textContent)
          this.bufferIndex = this.buffer.length
          this.buffer += `
          ${action[0]}
          ${article.textContent}
          `
          break
        case 'scroll':
          const chars = JSON.parse(args)
          this.bufferIndex += chars
          break
      }

      await this.getReply()
    }
  }

  async getReply(): Promise<Message> {
    console.log('getting reply')
    const response = await this.openai.createChatCompletion({
      model: 'gpt-4',
      messages: [{
        role: 'assistant',
        content: this.template(),
      }]
    })

    const reply = { author: 'AI', text: response.data.choices[0].message.content }
    this.eventEmitter.emit('message', reply)

    return reply
  }
  async sendMessage(message: Message): Promise<void> {
    if(message.text) {
      this.logs.push(message)
    }
    await this.getReply()
  }
}
