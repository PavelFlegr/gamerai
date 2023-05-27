import { useParams } from "react-router-dom";
import {
  ActionIcon,
  Box,
  Button,
  Card,
  Container,
  Divider,
  Flex,
  Loader,
  PasswordInput,
  ScrollArea,
  Space,
  Stack,
  Table,
  Text,
  Textarea,
  TextInput,
  ThemeIcon,
} from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import ky from "ky";

export default function Register() {
  const params = useParams();
  const [password, setPassword] = useInputState("");

  const register = async () => {
    const response = await ky
      .post("/api/register", {
        json: { token: params.token, password },
        timeout: false,
      })
      .json();
  };

  return (
    <Container mx="auto" size={400}>
      <h1>Register</h1>
      <PasswordInput
        label={"Select password"}
        value={password}
        onChange={setPassword}
      ></PasswordInput>
      <Space h={"xs"}></Space>
      <Button onClick={register}>Register</Button>
    </Container>
  );
}
