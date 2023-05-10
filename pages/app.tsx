import { Chat } from "@/components/Chat/Chat";
import { Navbar } from "@/components/Layout/Navbar";
import { Message } from "@/types";
import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { HumanChatMessage } from "langchain/schema";
import { ConversationalRetrievalQAChain, LLMChain } from "langchain/chains";
import {
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
  ChatPromptTemplate,
} from "langchain/prompts";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import localForage from "localforage";
import { Document } from "langchain/dist/document";
import { Thoughts } from "@/components/Memory/Thoughts";
import { Vectors } from "@/components/Memory/Vectors";
import { OpenAI } from "langchain/llms/openai";
import { Context } from "@/components/Memory/Context";

const today = new Date();
const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const dateString =
  monthNames[today.getMonth()] +
  " " +
  today.getDate() +
  " " +
  today.getFullYear();

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingSave, setLoadingSave] = useState<boolean>(false);

  const [thoughts, setThoughts] = useState<string>("");
  const [lastThought, setLastThought] = useState<string>("");

  const [vectorsString, setVectorsString] = useState<string>("");

  const [contextInjection, setContextInjection] = useState<string>("");

  const [apiKey, setAPIKey] = useState<string>("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [isInitiated, setIsInitiated] = useState<boolean>(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  async function handleSend(message: Message) {
    setLoading(true);

    const updatedMessages = [...messages, message];
    if (/^sk-/.test(apiKey) != true) {
      alert("API key not provided");
    }
    const key = apiKey;
    const chat = new ChatOpenAI({ openAIApiKey: key, temperature: 0.7 });
    const model = new OpenAI({ openAIApiKey: key, temperature: 0 });
    const assistantPrompt = ChatPromptTemplate.fromPromptMessages([
      SystemMessagePromptTemplate.fromTemplate(
        `You are AssistGPT, an AI friend. You are a very good listener and are very empathetic.
         Today is ${dateString}.
         These are your notes on the user's important items: "{importantItems}".
         These is information given to you by your long term memory search: "{historicalData}".
         This is the current conversation with the user in this session: "{messageHistory}"`
      ),
      HumanMessagePromptTemplate.fromTemplate("{text}"),
    ]);
    const chain = new LLMChain({
      prompt: assistantPrompt,
      llm: chat,
    });

    setMessages(updatedMessages);
    setLoading(true);

    let messageHistory = "";
    for (let i = 0; i < updatedMessages.length; i++) {
      messageHistory = messageHistory.concat(
        `${updatedMessages[i].role}: ${updatedMessages[i].content}; `
      );
    }

    if (vectorsString != "") {
      let vectors: any = new Map(JSON.parse(vectorsString));
      let vectorStore: MemoryVectorStore = new MemoryVectorStore(
        new OpenAIEmbeddings({ openAIApiKey: key })
      );
      vectors.forEach(async (values: Document[], keys: number[][]) => {
        await vectorStore.addVectors(keys, values);
      });

      const retrievalChain = ConversationalRetrievalQAChain.fromLLM(
        model,
        vectorStore.asRetriever()
      );
      const results = await retrievalChain.call({
        question:
          "Answer concisely in third person, referring to the user as 'The User' or by name:" +
          message.content,
        chat_history: messageHistory,
      });
      setContextInjection(results.text);
    }

    console.log(
      `History:${messageHistory} <==> Important: ${thoughts} <==> Context: ${contextInjection}`
    );
    var response = await chain.call({
      importantItems: thoughts,
      historicalData: contextInjection,
      messageHistory: messageHistory,
      text: message.content,
    });

    let isFirst = true;

    if (isFirst) {
      isFirst = false;
      setMessages((messages) => [
        ...messages,
        {
          role: "assistant",
          content: response.text,
        },
      ]);
      setLoading(false);
    } else {
      setMessages((messages) => {
        const lastMessage = messages[messages.length - 1];
        const updatedMessage = {
          ...lastMessage,
          content: lastMessage.content + response,
        };
        setLoading(false);
        return [...messages.slice(0, -1), updatedMessage];
      });
    }
  }

  async function handleSave() {
    setLoadingSave(true);

    const key = apiKey;
    const chat = new ChatOpenAI({ openAIApiKey: key, temperature: 0 });

    let messageHistory: string = "";

    messageHistory = `${dateString}: `;
    for (let i = 0; i < messages.length; i++) {
      messageHistory = messageHistory.concat(
        `${messages[i].role}: ${messages[i].content};\n\n `
      );
    }
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 10,
    });
    const output = await splitter.createDocuments([messageHistory]);
    let embedder = new OpenAIEmbeddings({ openAIApiKey: key });

    let docs: Document[] = [];
    let docStrings: string[] = [];

    if (vectorsString == "") {
      let vectors: Map<number[][], Document[]> = new Map();

      for (let i = 0; i < output.length; i++) {
        docs.push(output[i]);
        docStrings.push(output[i].pageContent);
      }
      const vectorKey = await embedder.embedDocuments(docStrings);
      vectors.set(vectorKey, docs);
      setVectorsString(JSON.stringify(Array.from(vectors.entries())));
    } else {
      let vectors: any = new Map(JSON.parse(vectorsString));
      for (let i = 0; i < output.length; i++) {
        docs.push(output[i]);
        docStrings.push(output[i].pageContent);
      }
      const vectorKey = await embedder.embedDocuments(docStrings);
      vectors.set(vectorKey, docs);
      setVectorsString(JSON.stringify(Array.from(vectors.entries())));
    }

    if (thoughts == "") {
      const importantItems = await chat.call([
        new HumanChatMessage(`This is the message history between the user and an AI: "${messageHistory}".
      Only if the user specifically asked to remember something important, summarize it.
      Do NOT write anything extra.
      Be SPECIFIC with dates.`),
      ]);
      setThoughts(importantItems.text);
      setLastThought(importantItems.text);
    } else {
      setLastThought(thoughts);
      const importantItems = await chat.call([
        new HumanChatMessage(`This is the message history between the user and an AI: "${messageHistory}".
      These are the current important things to remember for the user: "${thoughts}".
      If the user specifically discussed important items to remember, append the list with updates to important things to remember.
      Delete anything the user requests to delete.
      Do NOT write anything extra.
      Be SPECIFIC with dates.
      `),
      ]);
      setThoughts(importantItems.text);
    }

    setLoadingSave(false);
    handleReset();
  }

  function handleReset() {
    setMessages([
      {
        role: "assistant",
        content: `Hi there!`,
      },
    ]);
  }

  const handleUndo = async () => {
    setThoughts(lastThought);
  };

  const handleThoughtsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;

    if (value.length > 1000) {
      alert("Thoughts limit is 1000 characters");
      return;
    }

    setThoughts(value);
  };

  const handleContextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;

    if (value.length > 1000) {
      alert("Context limit is 1000 characters");
      return;
    }

    setContextInjection(value);
  };

  const handleVectorsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;

    setVectorsString(value);
  };

  useEffect(() => {
    setMessages([
      {
        role: "assistant",
        content: `Hi there! I'm AssistGPT. How can I help you?`,
      },
    ]);
    const setInitials = async () => {
      if ((await localForage.getItem("importantItems")) != null) {
        setThoughts(String(await localForage.getItem("importantItems")));
        setLastThought(String(await localForage.getItem("importantItems")));
      }
      if ((await localForage.getItem("vectorStoreData")) != null) {
        setVectorsString(String(await localForage.getItem("vectorStoreData")));
      }

      if ((await localForage.getItem("APIKEY")) != null) {
        setAPIKey(String(await localForage.getItem("APIKEY")));
      }
    };
    setInitials().then(() => {
      setIsInitiated(true);
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isInitiated) {
      localForage.setItem("importantItems", thoughts);
    }
  }, [thoughts, isInitiated]);

  useEffect(() => {
    if (isInitiated) {
      localForage.setItem("vectorStoreData", vectorsString);
    }
  }, [isInitiated, vectorsString]);

  return (
    <>
      <Head>
        <title>Assist GPT</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="dark:bg-neutral-900 h-screen">
        <Navbar />

        <div className="bg-inherit mx:2 md:grid md:grid-cols-5 sm:flex sm:flex-col">
          <div className="md:col-span-4 overflow-auto px-4 py-4">
            <Chat
              messages={messages}
              loading={loading}
              onSend={handleSend}
              // onReset={handleReset}
              onSave={handleSave}
              loadingSave={loadingSave}
            />
            <div ref={messagesEndRef} />
          </div>
          <div className="col-span-1">
            <Thoughts
              onThoughtsChange={handleThoughtsChange}
              onUndo={handleUndo}
              thoughts={thoughts}
            />
            <Context
              onContextChange={handleContextChange}
              context={contextInjection}
            />
            <Vectors
              vectors={vectorsString}
              onVectorsChange={handleVectorsChange}
            />
          </div>
        </div>
      </div>
    </>
  );
}
