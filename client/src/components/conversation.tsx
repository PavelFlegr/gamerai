import {
  ActionIcon,
  Box,
  Button,
  Card,
  Container,
  Flex,
  Loader,
  Modal,
  ScrollArea,
  Space,
  Stack,
  Text,
  Textarea,
  ThemeIcon,
} from "@mantine/core";
import { KeyboardEventHandler, useEffect, useRef, useState } from "react";
import { useDisclosure, useInputState, useTimeout } from "@mantine/hooks";
import ky from "ky";
import {
  CurrencyDollar,
  Send,
  Settings as SettingsIcon,
} from "tabler-icons-react";
import { Message, Settings } from "../model";
import SettingsComponent from "./settings";
import AuthGuard from "../auth-guard";
import MessageComponent from "./message";
import { Response } from "../model";
import { useParams } from "react-router-dom";

export default function Conversation() {
  const [settings, setSettings] = useState<Settings>({
    systemMsg: "",
    context: "",
    model: "gpt-4",
  });
  const { id } = useParams();
  const [opened, { open, close }] = useDisclosure(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useInputState("");
  const [responding, setResponding] = useState(false);
  const cost = messages
    .map((message) => message.cost)
    .reduce((a, b) => a + b, 0);
  const viewport = useRef<HTMLDivElement>(null);
  const scrollToBottom = useTimeout(
    () =>
      viewport.current?.scrollTo({
        top: viewport.current.scrollHeight,
        behavior: "smooth",
      }),
    0
  );

  useEffect(() => {
    ky.get(`/api/conversation/${id}/messages`)
      .json<Message[]>()
      .then((response) => {
        setMessages(response);
        scrollToBottom.start();
      });
  }, [id]);
  const saveSettings = (newSettings: Settings) => {
    setSettings(newSettings);
    close();
  };
  const handleEnter: KeyboardEventHandler<HTMLTextAreaElement> = async (e) => {
    if (e.key === "Enter" && !e.getModifierState("Shift")) {
      e.preventDefault();
      await sendMessage();
    }
  };

  const sendMessage = async () => {
    if (!input || responding) {
      return;
    }
    setResponding(true);
    let newMessages = [...messages, { role: "user", content: input, cost: 0 }];
    setMessages(newMessages);
    scrollToBottom.start();
    setInput("");
    try {
      const response = await ky
        .post(`/api/conversation/${id}`, {
          json: { content: input, settings },
          timeout: false,
        })
        .json<Response>();
      setMessages([
        ...messages,
        { role: "user", content: input, cost: response.promptCost },
        response.message,
      ]);
      scrollToBottom.start();
    } catch (e) {
      setMessages(messages);
    }
    setResponding(false);
  };

  return (
    <AuthGuard>
      <Modal opened={opened} onClose={close} title="Settings">
        <SettingsComponent
          saveSettings={saveSettings}
          settings={settings}
        ></SettingsComponent>
      </Modal>
      <Container w={1000} mx="auto">
        <Card h={"100vh"} shadow="sm">
          <Stack h={"100%"} justify="space-between">
            <ScrollArea viewportRef={viewport}>
              {messages.map((message, i) => (
                <MessageComponent key={i} message={message}></MessageComponent>
              ))}
              {responding ? (
                <div>
                  <Text fz="xs">{"assistant"}</Text>
                  <Loader variant="dots" />
                </div>
              ) : (
                <></>
              )}
            </ScrollArea>
            <Box>
              <Space h="xs" />
              <Textarea
                onKeyDown={handleEnter}
                minRows={5}
                value={input}
                onChange={setInput}
              />
              <Space h="xs" />
              <Flex justify="space-between">
                <Flex align="center" gap={5}>
                  <ThemeIcon color={"green"}>
                    <CurrencyDollar />
                  </ThemeIcon>
                  <Space h="xs"></Space>
                  <Text inline={true}>
                    {" "}
                    You've spent {cost}$ on this nonsense, good job
                  </Text>
                  <ThemeIcon color={"green"}>
                    <CurrencyDollar />
                  </ThemeIcon>
                </Flex>
                <Flex align={"center"} gap={5}>
                  <ActionIcon onClick={open}>
                    <SettingsIcon />
                  </ActionIcon>
                  <Button
                    rightIcon={<Send />}
                    disabled={responding}
                    onClick={sendMessage}
                  >
                    Send
                  </Button>
                </Flex>
              </Flex>
            </Box>
          </Stack>
        </Card>
      </Container>
    </AuthGuard>
  );
}
