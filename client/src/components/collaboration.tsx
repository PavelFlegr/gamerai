import React, { KeyboardEventHandler, useEffect, useState } from "react";
import ky from "ky";
import { useParams } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  Container,
  Flex,
  Loader,
  Space,
  Stack,
  Text,
  Textarea,
  ThemeIcon,
} from "@mantine/core";
import { useInputState, useTimeout } from "@mantine/hooks";
import AuthGuard from "../auth-guard";
import { Collaboration as CollaborationModel } from "../model";
import { CurrencyDollar, Send } from "tabler-icons-react";

export default function Collaboration() {
  const { id } = useParams();
  const [document, setDocument] = useInputState("");
  const [responding, setResponding] = useState(false);
  const [input, setInput] = useInputState("");
  const [collaboration, setCollaboration] = useState<CollaborationModel>({
    id: "",
    title: "",
    document: "",
    cost: 0,
  });
  useEffect(() => {
    setDocument(collaboration.document);
  }, [collaboration]);
  useEffect(() => {
    ky.get(`/api/collaboration/${id}`)
      .json<CollaborationModel>()
      .then((collaboration) => {
        setCollaboration(collaboration);
      });
  }, [id]);

  const saveDocument = useTimeout(
    async () =>
      await ky.put(`/api/collaboration`, {
        json: { document, id },
      }),
    3000
  );

  const updateDocument = (e: React.ChangeEvent) => {
    setDocument(e);
    saveDocument.start();
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
    setInput("");
    const response = await ky
      .post(`/api/collaboration/${id}`, {
        json: { instruction: input },
        timeout: false,
      })
      .json<CollaborationModel>();
    setCollaboration(response);

    setResponding(false);
  };

  return (
    <AuthGuard>
      <Container h={"100%"} w={1000} mx="auto">
        <Card h={"100%"} shadow="sm">
          <Stack h={"100%"} justify="end" align={"stretch"}>
            <Textarea
              autosize
              readOnly={responding}
              style={{ overflow: "auto", flexGrow: 1, height: "100%" }}
              value={document}
              onChange={updateDocument}
              placeholder={
                "Start writing or send an instruction to your assistant to do it for you"
              }
            ></Textarea>
            <Box>
              <Textarea
                placeholder={"Tell your assistant what you need"}
                onKeyDown={handleEnter}
                value={input}
                onChange={setInput}
                minRows={5}
              />
            </Box>
            <Flex justify="space-between">
              <Flex align="center" gap={5}>
                <ThemeIcon color={"green"}>
                  <CurrencyDollar />
                </ThemeIcon>
                <Space h="xs"></Space>
                <Text inline={true}>
                  {" "}
                  You've spent {collaboration.cost}$ on this nonsense, good job
                </Text>
                <ThemeIcon color={"green"}>
                  <CurrencyDollar />
                </ThemeIcon>
              </Flex>
              <Flex align={"center"} gap={5}>
                {responding ? <Loader /> : ""}
                <Button
                  rightIcon={<Send />}
                  disabled={responding}
                  onClick={sendMessage}
                >
                  Send
                </Button>
              </Flex>
            </Flex>
          </Stack>
        </Card>
      </Container>
    </AuthGuard>
  );
}
