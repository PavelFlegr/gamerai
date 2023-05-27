import { useNavigate } from "react-router-dom";
import {
  Button,
  Container,
  PasswordInput,
  Space,
  TextInput,
} from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import ky from "ky";
import { FormEvent, FormEventHandler } from "react";

export default function Login() {
  const [email, setEmail] = useInputState("");
  const [password, setPassword] = useInputState("");
  const navigate = useNavigate();

  const login = async (e: FormEvent) => {
    e.preventDefault();
    const response = await ky
      .post("/api/login", {
        json: { email, password },
        timeout: false,
      })
      .json();

    navigate("/");
  };

  return (
    <Container mx="auto" size={400}>
      <a href="/login">login</a>
      <h1>Login</h1>
      <form onSubmit={login}>
        <TextInput
          label={"email"}
          value={email}
          onChange={setEmail}
        ></TextInput>
        <PasswordInput
          label={"password"}
          value={password}
          onChange={setPassword}
        ></PasswordInput>
        <Space h={"xs"}></Space>
        <Button type={"submit"}>Login</Button>
      </form>
    </Container>
  );
}
