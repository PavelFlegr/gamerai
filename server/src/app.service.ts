import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  ChatCompletionResponseMessageRoleEnum,
  Configuration,
  CreateEmbeddingResponseDataInner,
  OpenAIApi,
} from 'openai';
import { format } from 'date-fns';
import got from 'got';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import { Message, Prompt } from './message.model.js';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import * as process from 'process';
import similarity from 'compute-cosine-similarity'

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

Jsi AI asistent. máš dostupné informace a nástroje (v podobě funkcí, např. browse("http://google.com"), save("information") nebo scroll(200))
Máš omezený kontext a bude třeba využít paměť a scroll
Pro dlouhodobé uložení dat můžeš použít zápis a čtení do souboru`
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
      console.log(action[1])
      const name = action[1]
      const args = action[2]
      switch (name) {
        case 'browse':
          console.log('browsing')
          try {
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
          } catch(e) {
            this.bufferIndex = this.buffer.length
            this.buffer += `url isn't valid\n`
          }
          break
        case 'scroll':
          console.log('scrolling')
          const chars = JSON.parse(args)
          this.bufferIndex += chars
          break
      }

      await this.getReply()
    }
  }

  cosinesim(A,B){
    let dotproduct=0;
    let mA=0;
    let mB=0;
    for(let i = 0; i < A.length; i++){
      dotproduct += (A[i] * B[i]);
      mA += (A[i]*A[i]);
      mB += (B[i]*B[i]);
    }
    mA = Math.sqrt(mA);
    mB = Math.sqrt(mB);

    return (dotproduct) / ((mA) * (mB));
  }

  chunkSubstr(str, size): string[] {
    const numChunks = Math.ceil(str.length / size)
    const chunks = new Array(numChunks)

    for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
      chunks[i] = str.substr(o, size)
    }

    return chunks
  }

  async sendPrompt(prompt: Prompt) {
    if (prompt.settings.systemMsg !== '') {
      prompt.messages = [{ role: 'system', content: prompt.settings.systemMsg }, ...prompt.messages]
    }

    let cost = 0

    if(prompt.settings.context !== '') {
      const contextBlocks = this.chunkSubstr(prompt.settings.context, 1000)

      const embeddingsResponse = await this.openai.createEmbedding({
        input: [prompt.messages[prompt.messages.length - 1].content, ...contextBlocks],
        model: 'text-embedding-ada-002'
      })

      cost += embeddingsResponse.data.usage.total_tokens * 0.0004 / 1000
      const [questionEmbedding, ...contextEmbeddings] = embeddingsResponse.data.data

      const similarities = contextEmbeddings.map(embedding => ({ ...embedding, similarity: similarity(embedding.embedding, questionEmbedding.embedding) })).sort((a, b) => b.similarity - a.similarity)

      const context = similarities.map(embedding => contextBlocks[embedding.index - 1])

      prompt.messages = [{ role: 'system', content: `Base your response only on the following data:\n${context.slice(0, 5).join('\n')}` }, ...prompt.messages]
    }

    const response = await this.openai.createChatCompletion({
      model: 'gpt-4',
      messages: prompt.messages,
    })

    const { prompt_tokens, completion_tokens } = response.data.usage
    cost += (prompt_tokens * 0.03 + completion_tokens * 0.06) / 1000
    return  { cost, message: { content: response.data.choices[0].message.content, role: 'assistant' }}
  }

  async singleResponse(input: string): Promise<string> {
    const response = await this.openai.createChatCompletion({
      model: 'gpt-4',
      messages: [{
        role: 'user',
        content: input,
      }]
    })

    return response.data.choices[0].message.content
  }

  async getReply(): Promise<Message> {
    console.log('getting reply')
    const response = await this.openai.createChatCompletion({
      model: 'gpt-4',
      messages: [{
        role: 'system',
        content: this.template(),
      }]
    })

    const reply = { author: ChatCompletionResponseMessageRoleEnum.Assistant, text: response.data.choices[0].message.content }
    this.eventEmitter.emit('message', reply)

    return reply
  }
  async sendMessage(message: Message): Promise<void> {
    if(message.text) {
      this.eventEmitter.emit('message', message)
    }
    await this.getReply()
  }
}
