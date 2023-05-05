import {
  Box,
  Button,
  Card,
  Container,
  Divider,
  MantineProvider,
  ScrollArea,
  Space, Stack,
  Text,
  Textarea,
} from '@mantine/core';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useInputState, useTimeout } from '@mantine/hooks';
import { io, Socket } from 'socket.io-client';
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
  const [cost, setCost] = useState(0);
  const viewport = useRef<HTMLDivElement>(null);
  const scrollToBottom = useTimeout(() => viewport.current?.scrollTo({ top: viewport.current.scrollHeight, behavior: 'smooth' }), 0);

  const sendMessage = async () => {
    let newMessages = [...messages, { author: 'user', text: input }]
    setMessages(newMessages)
    scrollToBottom.start()
    if(input) {
      setInput('')
    }
    const response = await ky.post('/api/chat', {json: newMessages, timeout: false}).json<Response>()
    setCost(cost + response.cost)
    setMessages([...newMessages, response.message])
    scrollToBottom.start()
  }

  return (
      <Container mx="auto">
        <Card shadow="sm">
          <Stack justify="space-between">
            <ScrollArea h={700} viewportRef={viewport}>
              {messages.map((message, i) => (
                <div key={i}>
                  <Text fz="xs">{message.author}</Text>
                  <Text style={{whiteSpace: 'break-spaces'}}>{message.text}</Text>
                  <Divider/>
                </div>
              ))}
            </ScrollArea>
            <Box>
              <Space h="xs"/>
              <Textarea value={input} onChange={setInput}/>
              <Space h="xs"/>
              <Button onClick={sendMessage}>Send</Button>
              You spent { cost }$ in total to do this nonsense, good job
            </Box>
          </Stack>

        </Card>
      </Container>
  );
}