import { Chat } from "@/components/Chat/Chat";
import { Footer } from "@/components/Layout/Footer";
import { Navbar } from "@/components/Layout/Navbar";
import { Message } from "@/types";
import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { HumanChatMessage, SystemChatMessage } from "langchain/schema";
import { LLMChain } from "langchain/chains";
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
import {UndoThoughts} from "@/components/Chat/UndoThoughts"
import { ReactMarkdown } from "react-markdown/lib/react-markdown";
import remarkGFM from "remark-gfm";

const today = new Date();
const monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const dateString = monthNames[today.getMonth()] + " " + today.getDate() + " " + today.getFullYear();

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingSave,setLoadingSave] = useState<boolean>(false);

  const [thoughts, setThoughts] = useState<string>("");

  const [lastThought, setLastThought] = useState<string>("");

  const messagesEndRef = useRef<HTMLDivElement>(null);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async (message: Message) => {
    setLoading(true);

    const updatedMessages = [...messages, message];

    const key = String(await localForage.getItem("APIKEY"));
    const chat = new ChatOpenAI({ openAIApiKey: key, temperature: 0.7 })
  const assistantPrompt = ChatPromptTemplate.fromPromptMessages([
    SystemMessagePromptTemplate.fromTemplate(
      `You are AssistGPT, a helpful, fridnely AI assistant that helps the user, specializing in helping the user keep track of to-do's. You will try to keep the conversation going and will always try to ask the user follow up questions.
       Today is ${dateString}.
         These are the user's to-do's you need to remember: "{importantItems}".
         These are relevant past conversations with the user, where you are "assistant" and the user is "user": "{historicalData}".
         This is the history of your current conversation with the user in this session, where you are "assistant" and the user is "user": "{messageHistory}"`
    ),
    HumanMessagePromptTemplate.fromTemplate("{text}"),
  ]);
  const chain = new LLMChain({
    prompt:assistantPrompt,
    llm: chat,
  });

    setMessages(updatedMessages);
    setLoading(true);

    let messageHistory = "";
    for (let i = 0; i < updatedMessages.length; i++) {
      messageHistory = messageHistory.concat(`${updatedMessages[i].role}: ${updatedMessages[i].content}; `)
    }
    let contextInjection = "NO PAST CONVERSATIONS";
    if (await localForage.getItem("vectorStoreData") != null){
      let vectors:any = await localForage.getItem("vectorStoreData")
      let vectorStore:MemoryVectorStore = new MemoryVectorStore(new OpenAIEmbeddings({openAIApiKey:key}) );
      vectors.forEach(async (values:Document[],keys:number[][]) => {
        await vectorStore.addVectors(keys,values)
      });
      // const results = await vectorStore.similaritySearch(message.content, 5);
      contextInjection = "";
      const results = await vectorStore.similaritySearchWithScore(message.content);
      for (let i =0; i < results.length; i++){
        if (results[i][1] > 0.5){
          contextInjection = contextInjection.concat(`${results[i][0].pageContent};`)
        }
      }
    }
    if (thoughts == "") {
      console.log(`History:${messageHistory} <==> Important: NONE SO FAR <==> Context: ${contextInjection}`)
      var response = await chain.call({importantItems: "NONE", historicalData:contextInjection, messageHistory: messageHistory, text: message.content});
    }
    else if (thoughts != "") {
      console.log(`History:${messageHistory} <==> Important: ${thoughts} <==> Context: ${contextInjection}`)
      var response = await chain.call({importantItems: thoughts, historicalData:contextInjection, messageHistory: messageHistory, text: message.content});
    }
    let isFirst = true;

      if (isFirst) {
        isFirst = false;
        setMessages((messages) => [
          ...messages,
          {
            role: "assistant",
            content: response.text
          }
        ]);
        setLoading(false);
      } else {
        setMessages((messages) => {
          const lastMessage = messages[messages.length - 1];
          const updatedMessage = {
            ...lastMessage,
            content: lastMessage.content + response
          };
          setLoading(false);
          return [...messages.slice(0, -1), updatedMessage];
        });
      }
    }

  const handleSave = async () => {
    setLoadingSave(true);
    const key = String(await localForage.getItem("APIKEY"));
    const chat = new ChatOpenAI({ openAIApiKey: key, temperature: 0 })

    let messageHistory:string = "";

    messageHistory =`${dateString}: `; 
    for (let i = 0; i < messages.length; i++) {
      messageHistory = messageHistory.concat(`${messages[i].role}: ${messages[i].content};\n `)
    }
    const splitter = new RecursiveCharacterTextSplitter({chunkSize:100,chunkOverlap:5});
    const output = await splitter.createDocuments([messageHistory]);
    let embedder = new OpenAIEmbeddings({openAIApiKey:key});

    let docs:Document[] = [];
    let docStrings:string[]=[];

    if (await localForage.getItem("vectorStoreData") == null){
      let vectors:Map<number[][],Document[]>= new Map();

      for (let i = 0; i < output.length; i++){
      docs.push(output[i]);
      docStrings.push(output[i].pageContent);
      }
      const vectorKey = await embedder.embedDocuments(docStrings);
      vectors.set(vectorKey, docs)
      await localForage.setItem("vectorStoreData", vectors);
      
    }
    else {

      let vectors:any = await localForage.getItem("vectorStoreData")
      for (let i = 0; i < output.length; i++){
      docs.push(output[i]);
      docStrings.push(output[i].pageContent);
      }
      const vectorKey = await embedder.embedDocuments(docStrings);
      vectors.set(vectorKey, docs)
      await localForage.setItem("vectorStoreData", vectors);
      
    }

    if (thoughts == "") {
      const importantItems = await chat.call([new HumanChatMessage(`This is the message history between you and the user: "${messageHistory}".
       What are the to-do's, if any, the user has discussed about? Answer with just a markdown numbered list
       and use specific dates if necessary.`)])
      localForage.setItem("importantItems", importantItems.text);
      setThoughts(importantItems.text);
      setLastThought(importantItems.text);
    }
    else {
      setLastThought(thoughts);
      const importantItems = await chat.call([new HumanChatMessage(`This is the message history between you and the user: "${messageHistory}".
       These are the to-do's you have for the user so far: "${thoughts}".
       For each to-do, if there is a change, update the to-do based on what the user has said. Only if they say they have completed a to-do, will you check it off.
       Answer with just a markdown numbered list and use specific dates if necessary.`)])
      localForage.setItem("importantItems",String(importantItems.text));
      setThoughts(importantItems.text);
    }
    setLoadingSave(false);
    handleReset();
  };

  const handleReset = () => {
    setMessages([
      {
        role: "assistant",
        content: `Hi there!`
      }
    ]);
  };


  const handleUndo = () => {
    setThoughts(lastThought);
    localForage.setItem("importantItems",String(lastThought));

  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    setMessages([
      {
        role: "assistant",
        content: `Hi there! I'm AssistGPT. How can I help you?`
      }
    ]);
    const setInitialThoughts =async () => {
      if (await localForage.getItem("importantItems") != null){
        setThoughts(String(await localForage.getItem("importantItems")));
        setLastThought(String(await localForage.getItem("importantItems")));
      }
    }
    setInitialThoughts();
  }, []);

  return (
    <>
      <Head>
        <title>Assist GPT</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        />
        <link
          rel="icon"
          href="/favicon.ico"
        />
      </Head>
      <Navbar />

      <div className="md:grid md:grid-cols-5 sm:flex sm:flex-col">

        <div className="md:col-span-4 overflow-auto px-4 py-4">
            <Chat
              messages={messages}
              loading={loading}
              onSend={handleSend}
             // onReset={handleReset}
              onSave={handleSave}
              loadingSave = {loadingSave}
            />
            <div ref={messagesEndRef} />
        </div>
        <div className="col-span-1">
          <div className="rounded-lg border border-neutral-300 px-4 py-4 mx-4 my-4">
            <div className="flex-col">
              <p className="font-sans text-xl">AssistGPT's Thoughts:</p>
            <p className="font-sans py-2"><ReactMarkdown remarkPlugins={[remarkGFM]}>{thoughts}</ReactMarkdown></p></div>
            <UndoThoughts onUndo={handleUndo} />
            </div>
        </div>
      </div>

    </>
  );
  }
