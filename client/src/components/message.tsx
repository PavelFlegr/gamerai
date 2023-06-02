import { Divider, Table, Text } from "@mantine/core";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { a11yDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Message as MessageInterface } from "../model";

export default function Message(props: { message: MessageInterface }) {
  return (
    <div style={{ maxWidth: 890 }}>
      <Text fz="xs">
        {props.message.role} - {props.message.cost}$
      </Text>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            return !inline && match ? (
              <SyntaxHighlighter
                {...props}
                children={String(children).replace(/\n$/, "")}
                style={{ ...a11yDark }}
                language={match[1]}
                PreTag="div"
              />
            ) : (
              <code {...props} className={className}>
                {children}
              </code>
            );
          },
          table({ node, ...props }) {
            return <Table {...props} />;
          },
        }}
      >
        {props.message.content}
      </ReactMarkdown>
      <Divider />
    </div>
  );
}
