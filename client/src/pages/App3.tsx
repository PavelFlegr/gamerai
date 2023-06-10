import {
  Navbar,
  NavLink,
  Text,
  TextInput,
  ActionIcon,
  Button,
  Tabs,
  AppShell,
  Header,
  Anchor,
  Container,
  Stack,
  Flex,
} from "@mantine/core";
import React, { useEffect, useRef, useState } from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import AuthGuard from "../auth-guard";
import ky from "ky";
import { Collaboration, Conversation } from "../model";
import StartConversation from "../components/start-conversation";
import { Check, Edit, Trash, X } from "tabler-icons-react";
import { useInputState } from "@mantine/hooks";
import StartCollaboration from "../components/start-collaboration";

function ConversationItem(props: {
  conversation: Conversation;
  reload: () => void;
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [edit, setEdit] = useState(false);
  const { conversation } = props;
  const [input, setInput] = useInputState(conversation.title);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (edit) {
      ref.current?.select();
    }
  }, [edit]);
  const startEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    setInput(conversation.title);
    setEdit(true);
  };

  const removeConversation = async (e: React.MouseEvent) => {
    e.preventDefault();
    await ky.delete(`/api/conversation/${conversation.id}`);
    props.reload();
  };

  const updateTitle = async (e: React.MouseEvent) => {
    e.preventDefault();
    await ky.put(`/api/conversation`, {
      json: { ...conversation, title: input },
    });
    props.reload();
    setEdit(false);
  };

  if (edit) {
    return (
      <NavLink
        h={44}
        label={
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <TextInput
              variant={"unstyled"}
              ref={ref}
              value={input}
              onChange={setInput}
              style={{ margin: 0 }}
            ></TextInput>
            <div>
              <Button.Group>
                <ActionIcon onClick={updateTitle}>
                  <Check color={"green"} />
                </ActionIcon>
                <ActionIcon onClick={() => setEdit(false)}>
                  <X color={"red"}></X>
                </ActionIcon>
              </Button.Group>
            </div>
          </div>
        }
      ></NavLink>
    );
  }

  return (
    <NavLink
      h={44}
      label={
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text>{conversation.title}</Text>
          <div>
            <Button.Group>
              <ActionIcon>
                <Edit onClick={startEdit} />
              </ActionIcon>
              <ActionIcon onClick={removeConversation}>
                <Trash />
              </ActionIcon>
            </Button.Group>
          </div>
        </div>
      }
      active={conversation.id === id}
      onClick={() => navigate(`/conversation/${conversation.id}`)}
    />
  );
}

function CollaborationItem(props: {
  collaboration: Collaboration;
  reload: () => void;
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [edit, setEdit] = useState(false);
  const { collaboration } = props;
  const [input, setInput] = useInputState(collaboration.title);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (edit) {
      ref.current?.select();
    }
  }, [edit]);
  const startEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    setInput(collaboration.title);
    setEdit(true);
  };

  const remooveCollaboration = async (e: React.MouseEvent) => {
    e.preventDefault();
    await ky.delete(`/api/collaboration/${collaboration.id}`);
    props.reload();
  };

  const updateTitle = async (e: React.MouseEvent) => {
    e.preventDefault();
    await ky.put(`/api/collaboration`, {
      json: { ...collaboration, title: input },
    });
    props.reload();
    setEdit(false);
  };

  if (edit) {
    return (
      <NavLink
        h={44}
        label={
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <TextInput
              variant={"unstyled"}
              ref={ref}
              value={input}
              onChange={setInput}
              style={{ margin: 0 }}
            ></TextInput>
            <div>
              <Button.Group>
                <ActionIcon onClick={updateTitle}>
                  <Check color={"green"} />
                </ActionIcon>
                <ActionIcon onClick={() => setEdit(false)}>
                  <X color={"red"}></X>
                </ActionIcon>
              </Button.Group>
            </div>
          </div>
        }
      ></NavLink>
    );
  }

  return (
    <NavLink
      h={44}
      label={
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text>{collaboration.title}</Text>
          <div>
            <Button.Group>
              <ActionIcon>
                <Edit onClick={startEdit} />
              </ActionIcon>
              <ActionIcon onClick={remooveCollaboration}>
                <Trash />
              </ActionIcon>
            </Button.Group>
          </div>
        </div>
      }
      active={collaboration.id === id}
      onClick={() => navigate(`/collaboration/${collaboration.id}`)}
    />
  );
}

export default function App3() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);

  const navigate = useNavigate();
  const { id } = useParams();

  const reloadConversations = () => {
    ky.get("/api/conversation")
      .json<Conversation[]>()
      .then((response) => {
        setConversations(response);
      });
  };

  const reloadCollaborations = () => {
    ky.get("/api/collaboration")
      .json<Collaboration[]>()
      .then((response) => {
        setCollaborations(response);
      });
  };

  useEffect(() => {
    reloadConversations();
    reloadCollaborations();
  }, [id]);

  return (
    <AuthGuard>
      <Flex>
        <Navbar
          style={{ flexGrow: 0, overflow: "hidden", minWidth: 200 }}
          w={200}
        >
          <Tabs defaultValue={"chat"} variant={"outline"}>
            <Tabs.List grow>
              <Tabs.Tab value={"chat"}>Chat</Tabs.Tab>
              <Tabs.Tab value={"collab"}>Collab</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel h={"100vh"} value={"chat"}>
              <StartConversation style={{ width: "100%" }} />
              {conversations.map((conversation) => (
                <ConversationItem
                  key={conversation.id}
                  reload={reloadConversations}
                  conversation={conversation}
                />
              ))}
            </Tabs.Panel>
            <Tabs.Panel value={"collab"}>
              <StartCollaboration
                style={{ width: "100%" }}
              ></StartCollaboration>
              {collaborations.map((collaboration) => (
                <CollaborationItem
                  key={collaboration.id}
                  reload={reloadCollaborations}
                  collaboration={collaboration}
                />
              ))}
            </Tabs.Panel>
          </Tabs>
        </Navbar>
        <div style={{ flexGrow: 1, height: "100vh" }}>
          <Stack h={"100%"}>
            <Header height={37} style={{ height: 37 }}>
              <Button
                onClick={() => navigate("/database")}
                variant={"subtle"}
                component={"button"}
              >
                Database
              </Button>
            </Header>
            <div style={{ flexGrow: 1, overflow: "auto" }}>
              <Outlet />
            </div>
          </Stack>
        </div>
      </Flex>
    </AuthGuard>
  );
}
