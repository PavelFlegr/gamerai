import {
  Box,
  Button,
  Card,
  Container,
  Divider, Loader,
  ScrollArea,
  Space, Stack,
  Text,
  Textarea,
} from '@mantine/core';
import { KeyboardEventHandler, useRef, useState } from 'react';
import { useInputState, useTimeout } from '@mantine/hooks';
import ky from 'ky';

interface Response {
  message: Message,
  cost: number,
}
interface Message {
  author: string
  text: string
}

export default function App3() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useInputState('')
  const [responding, setResponding] = useState(false)
  const [cost, setCost] = useState(0);
  const viewport = useRef<HTMLDivElement>(null);
  const scrollToBottom = useTimeout(() => viewport.current?.scrollTo({ top: viewport.current.scrollHeight, behavior: 'smooth' }), 0);

  const handleEnter: KeyboardEventHandler<HTMLTextAreaElement> = async (e) => {
    if(e.key === 'Enter' && !e.getModifierState('Shift')) {
      e.preventDefault()
      await sendMessage()
    }
  }

  const sendMessage = async () => {
    if(!input || responding) {
      return
    }
    setResponding(true)
    let newMessages = [...messages, { author: 'user', text: input }]
    setMessages(newMessages)
    scrollToBottom.start()
    setInput('')
    const response = await ky.post('/api/chat', {json: newMessages, timeout: false}).json<Response>()
    setCost(cost + response.cost)
    setMessages([...newMessages, response.message])
    scrollToBottom.start()
    setResponding(false)
  }

  return (
      <Container mx="auto">
        <Card h={'100vh'} shadow="sm">
          <Stack h={'100%'} justify="space-between">
            <ScrollArea viewportRef={viewport}>
              {messages.map((message, i) => (
                <div key={i}>
                  <Text fz="xs">{message.author}</Text>
                  <Text style={{whiteSpace: 'break-spaces'}}>{message.text}</Text>
                  <Divider/>
                </div>
              ))}
              {responding ?
                <div>
                  <Text fz="xs">{'assistant'}</Text>
                  <Loader variant='dots'/>
                </div> : <></>}
            </ScrollArea>
            <Box>
              <Space h="xs"/>
              <Textarea onKeyDown={handleEnter} minRows={5} value={input} onChange={setInput}/>
              <Space h="xs"/>
              <Button disabled={responding} onClick={sendMessage}>Send</Button>
              You spent { cost }$ in total to do this nonsense, good job
            </Box>
          </Stack>
        </Card>
      </Container>
  );
}