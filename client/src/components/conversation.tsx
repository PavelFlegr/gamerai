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
import { Message } from "../model";
import SettingsComponent from "./settings";
import AuthGuard from "../auth-guard";
import MessageComponent from "./message";
import { Response, Conversation as ConversationModel } from "../model";
import { useParams } from "react-router-dom";

export default function Conversation() {
  const [settings, setSettings] = useState<ConversationModel>({
    systemMsg: "",
    context: "",
    blockSize: 500,
    blockCount: 10,
    title: "New conversation",
    id: "",
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
      .then((messages) => {
        setMessages(messages);
        scrollToBottom.start();
      });
    ky.get(`/api/conversation/${id}`)
      .json<ConversationModel>()
      .then((response) => {
        setSettings(response);
        scrollToBottom.start();
      });
  }, [id]);
  const saveSettings = async (newSettings: ConversationModel) => {
    setSettings(newSettings);
    await ky.put(`/api/conversation`, {
      json: newSettings,
    });
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
          json: { content: input },
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
    <>
      <Modal opened={opened} onClose={close} title="Settings">
        <SettingsComponent
          saveSettings={saveSettings}
          settings={settings}
        ></SettingsComponent>
      </Modal>
      <Container h={"100%"} w={1000} mx="auto">
        <Card h={"100%"} shadow="sm">
          <Stack h={"100%"} justify="space-between">
            <ScrollArea style={{ flexGrow: 1 }} viewportRef={viewport}>
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
                placeholder={"Send a message"}
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
    </>
  );
}
