import {
  ActionIcon,
  Box,
  Button,
  Card,
  Container,
  Divider, Flex, Loader, Modal,
  ScrollArea,
  Space, Stack, Table,
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
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { a11yDark } from 'react-syntax-highlighter/dist/esm/styles/prism';


interface Response {
  message: Message,
  cost: number,
}
interface Message {
  role: string
  content: string
}

export default function App3() {
  const [settings, setSettings] = useState<Settings>({ systemMsg: '', context: '' })
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
    let newMessages = [...messages, { role: 'user', content: input }]
    setMessages(newMessages)
    scrollToBottom.start()
    setInput('')
    const response = await ky.post('/api/chat', {json: {messages: newMessages, settings}, timeout: false}).json<Response>()
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
                <div style={{whiteSpace:'break-spaces'}} key={i}>
                  <Text fz="xs">{message.role}</Text>
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                    code({node, inline, className, children, ...props}) {
                      const match = /language-(\w+)/.exec(className || '')
                      return !inline && match ? (
                        <SyntaxHighlighter
                          {...props}
                          children={String(children).replace(/\n$/, '')}
                          style={a11yDark}
                          language={match[1]}
                          PreTag="div"
                        />
                      ) : (
                        <code {...props} className={className}>
                          {children}
                        </code>
                      )
                    },
                    table({node, ...props}) {
                      return <Table {...props}/>
                    }
                  }}>{message.content}</ReactMarkdown>
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