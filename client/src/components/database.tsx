import {
  ActionIcon,
  Anchor,
  Button,
  Container,
  FileButton,
  Flex,
  Group,
  SimpleGrid,
  Space,
  Stack,
  Table,
  TextInput,
} from "@mantine/core";
import ky from "ky";
import { useInputState } from "@mantine/hooks";
import { useEffect, useState } from "react";
import { IconHttpDelete } from "@tabler/icons-react";

interface FileModel {
  id: string;
  name: string;
  content: string;
}

interface SearchResult {
  fileId: string;
  name: string;
  chunk: string;
}

export function Database() {
  const [query, setQuery] = useInputState("");
  const [files, setFiles] = useState<FileModel[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [file, setFile] = useState<FileModel>();

  useEffect(() => {
    ky.get("/api/file")
      .json<FileModel[]>()
      .then((res) => setFiles(res));
  }, []);
  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.set("file", file);
    const response = await ky
      .post("/api/file", {
        body: formData,
      })
      .json<FileModel>();
    setFiles([...files, response]);
  };

  const search = async () => {
    const results = await ky
      .post("/api/file/search", { json: { query } })
      .json<SearchResult[]>();

    setSearchResults(results);
  };

  const getFile = async (fileId: string) => {
    const file = await ky.get(`/api/file/${fileId}`).json<FileModel>();
    setFile(file);
  };

  const deleteFile = async (fileId: string) => {
    const file = await ky.delete(`/api/file/${fileId}`).json<FileModel>();
    setFiles(files.filter((file) => file.id !== fileId));
  };

  return (
    <Container>
      <Flex>
        <FileButton onChange={uploadFile} accept={"text/*"}>
          {(props) => <Button {...props}>Upload File</Button>}
        </FileButton>
        <TextInput
          onChange={setQuery}
          style={{ flexGrow: 1 }}
          placeholder={"Ask and you shall receive"}
        ></TextInput>
        <Button onClick={search}>Search</Button>
      </Flex>
      {searchResults.map((sr) => {
        return (
          <div>
            <Anchor onClick={() => getFile(sr.fileId)}>{sr.name}</Anchor> -{" "}
            {sr.chunk}
          </div>
        );
      })}
      <Space h={20} />
      <h2>{file?.name}</h2>
      <div style={{ whiteSpace: "pre-wrap" }}>{file?.content}</div>

      <Space h={20} />
      <h2>All Files</h2>
      <Table style={{ width: 300 }}>
        {files.map((file) => {
          return (
            <tr>
              <td>
                <Anchor onClick={() => getFile(file.id)}>{file.name}</Anchor>
              </td>
              <td>
                <ActionIcon onClick={() => deleteFile(file.id)} color={"red"}>
                  <IconHttpDelete></IconHttpDelete>
                </ActionIcon>
              </td>
            </tr>
          );
        })}
      </Table>
    </Container>
  );
}
