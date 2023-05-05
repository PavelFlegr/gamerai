import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service.js';
import got from 'got';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import { gotScraping } from 'got-scraping';
import { Message } from './message.model.js';


interface Request {
  instruction: string,
  resources: {
    type: string,
    value: string,
  }[]
}
@Controller('api')
export class AppController {

  constructor(private appService: AppService) {
  }
  @Post('shorten')
  async shorten(@Body() request: { text: string }) {
    let {text} = request
    let result = ""
    const parts: string[] = []
    while(text.length) {
      const part = text.substring(0, 1000)
      result = await this.appService.singleResponse(`update this text\n${result}\nbased on the following information. keep it concise\n${part}`)
      parts.push(result)
      text = text.substring(800)
    }

    return parts
  }

  async getContent(url: string) {
    let data = await gotScraping.get(url).text()
    const doc = new JSDOM(data, { url: url })
    const article = new Readability(doc.window.document).parse()

    return article.textContent
  }

  @Post('answer')
  async answer(@Body() request: Request) {
    const {resources, instruction} = request
    let result = ""
    for(const resource of resources) {
      let text = resource.type === 'url' ? await this.getContent(resource.value) : resource.value
      while(text.length) {
        console.log(text.length)
        const part = text.substring(0, 10000)
        result = await this.appService.singleResponse(`improve the answer to the users request\n ${instruction}\n current answer:${result}\nbased on the following\n${part}`)
        console.log(result)
        text = text.substring(10000)
      }
    }

    return result
  }

  @Post('chat')
  async chat(@Body() messages: Message[]) {
    return await this.appService.sendPrompt(messages)
  }
}