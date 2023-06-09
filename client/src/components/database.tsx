import {
  Anchor,
  Button,
  Container,
  FileButton,
  Flex,
  Space,
  Stack,
  TextInput,
} from "@mantine/core";
import ky from "ky";
import { useInputState } from "@mantine/hooks";
import { useEffect, useState } from "react";

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
  const uploadFile = (file: File) => {
    const formData = new FormData();
    formData.set("file", file);
    ky.post("/api/file", {
      body: formData,
    });
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
      {file?.content}
    </Container>
  );
}
