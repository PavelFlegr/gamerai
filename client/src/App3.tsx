import {
  ActionIcon,
  Box,
  Button,
  Card,
  Container,
  Divider, Flex, Loader, Modal,
  ScrollArea,
  Space, Stack,
  Text,
  Textarea, ThemeIcon,
} from '@mantine/core';
import { KeyboardEventHandler, useRef, useState } from 'react';
import { useDisclosure, useInputState, useTimeout } from '@mantine/hooks';
import ky from 'ky';
import {
  CurrencyDollar,
  Send,
  Settings as SettingsIcon,
} from 'tabler-icons-react';
import { Settings } from './model';
import SettingsComponent from './components/settings';

interface Response {
  message: Message,
  cost: number,
}
interface Message {
  author: string
  text: string
}

export default function App3() {
  const [settings, setSettings] = useState({ systemMsg: '' })
  const [opened, { open, close }] = useDisclosure(false);
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useInputState('')
  const [responding, setResponding] = useState(false)
  const [cost, setCost] = useState(0);
  const viewport = useRef<HTMLDivElement>(null);
  const scrollToBottom = useTimeout(() => viewport.current?.scrollTo({ top: viewport.current.scrollHeight, behavior: 'smooth' }), 0);

  const saveSettings = (newSettings: Settings) => {
    setSettings(newSettings)
    close()
  }
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
    const response = await ky.post('/api/chat', {json: [{ author: 'system', text: settings.systemMsg }, ...newMessages], timeout: false}).json<Response>()
    setCost(cost + response.cost)
    setMessages([...newMessages, response.message])
    scrollToBottom.start()
    setResponding(false)
  }

  return (
    <>
      <Modal opened={opened} onClose={close} title="Settings">
        <SettingsComponent saveSettings={saveSettings} settings={settings}></SettingsComponent>
      </Modal>
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
              <Flex justify="space-between">
                <Flex align="center" gap={5}>
                  <ThemeIcon color={'green'}><CurrencyDollar/></ThemeIcon>
                  <Space h="xs"></Space>
                  <Text inline={true}> You've spent {cost}$ on this nonsense, good job</Text>
                  <ThemeIcon color={'green'}><CurrencyDollar/></ThemeIcon>
                </Flex>
                <Flex align={'center'} gap={5}>
                  <ActionIcon onClick={open}><SettingsIcon/></ActionIcon>
                  <Button rightIcon={<Send/>} disabled={responding} onClick={sendMessage}>Send</Button>
                </Flex>

              </Flex>
            </Box>
          </Stack>
        </Card>
      </Container>
    </>

  );
}