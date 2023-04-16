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

interface Message {
  author: string
  text: string
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useInputState('')
  const viewport = useRef<HTMLDivElement>(null);
  const scrollToBottom = useTimeout(() => viewport.current?.scrollTo({ top: viewport.current.scrollHeight, behavior: 'smooth' }), 0);
  const [socket, setSocket] = useState(io({ autoConnect: false }));

  useEffect(() => {
    socket.connect();
    const handleMessage = (args: Message) => {
      setMessages((prevMessages) => [...prevMessages, args])
      scrollToBottom.start()
    };

    socket.on('message', handleMessage);
    socket.emitWithAck('init').then(setMessages)

    return () => {
      socket.off('message', handleMessage)
    };
  }, [socket]);

  const sendMessage = async () => {
    socket.emit('message', { author: 'user', text: input })
    if(input) {
      setInput('')
    }
  }

  return (
      <Container mx="auto">
        <Card shadow="sm">
          <Stack justify="space-between">
            <ScrollArea h={700} viewportRef={viewport}>
              {messages.map((message, i) => (
                <>
                  <Text fz="xs">{message.author}</Text>
                  <Text style={{whiteSpace: 'break-spaces'}}>{message.text}</Text>
                  <Divider/>
                </>
              ))}
            </ScrollArea>
            <Box>
              <Space h="xs"/>
              <Textarea value={input} onChange={setInput}/>
              <Space h="xs"/>
              <Button onClick={sendMessage}>Send</Button>
            </Box>
          </Stack>

        </Card>
      </Container>
  );
}