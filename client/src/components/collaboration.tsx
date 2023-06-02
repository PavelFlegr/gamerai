import { KeyboardEventHandler, useEffect, useState } from "react";
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
import { useInputState } from "@mantine/hooks";
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
      <Container w={1000} mx="auto">
        <Card h={"100vh"} shadow="sm">
          <Stack h={"100%"} justify="space-between" align={"stretch"}>
            <Textarea
              autosize
              minRows={30}
              style={{ overflow: "scroll" }}
              value={document}
              onChange={setDocument}
            ></Textarea>
            <Box>
              <Textarea
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
