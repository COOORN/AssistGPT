import { Chat } from "@/components/Chat/Chat";
import { Footer } from "@/components/Layout/Footer";
import { Navbar } from "@/components/Layout/Navbar";
import { Message } from "@/types";
import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import { OpenAI } from "langchain/llms/openai";
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
import { VectorStore } from "langchain/dist/vectorstores/base";

let debugString:string;
//         <div className="gap-5"><p className="text-xs">{debugString}</p></div>

let key:string;

const today = new Date();
const monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const dateString = monthNames[today.getMonth()] + " " + today.getDate() + " " + today.getFullYear();

export default async function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingSave,setLoadingSave] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async (message: Message) => {
    const updatedMessages = [...messages, message];
    key = String(await localForage.getItem("APIKEY"));
    const chat = new ChatOpenAI({ openAIApiKey: key, temperature: 0.7 })
  const assistantPrompt = ChatPromptTemplate.fromPromptMessages([
    SystemMessagePromptTemplate.fromTemplate(
      `You are AssistGPT, a helpful AI assistant that helps the user.
       Today is ${dateString}.
         You have long term memory, where these are the lists you always need to remember: "{importantItems}".
         These are relevant past conversations with the user, where you are "assistant" and the user is "user": "{historicalData}". Ignore any information that is unecessary.
         This is the history of your conversation with the user in this session, where you are "assistant" and the user is "user": "{messageHistory}"`
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
      const results = await vectorStore.similaritySearch(message.content, 5);
      contextInjection = "";
      for (let i = 0; i < results.length; i++) {
        contextInjection = contextInjection.concat(`${results[i].pageContent};`)
      }    
    }
    //console.log(`History:${messageHistory} <==> Important: ${String(await localForage.getItem("importantItems"))} <==> Context: ${contextInjection}`)
    if (await localForage.getItem("importantItems") == null) {
      var response = await chain.call({importantItems: "NONE SO FAR", historicalData:contextInjection, messageHistory: messageHistory, text: message.content});
    }
    else {
      console.log(String(await localForage.getItem("importantItems")))
      var response = await chain.call({importantItems: String(await localForage.getItem("importantItems")), historicalData:contextInjection, messageHistory: messageHistory, text: message.content});
    }
    let isFirst = true;
    setLoading(true);

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

  const handleReset = () => {
    setMessages([
      {
        role: "assistant",
        content: `Hi there!`
      }
    ]);
  };
  let embedder;
  const handleSave = async () => {
    setLoadingSave(true);
    const chat = new ChatOpenAI({ openAIApiKey: key, temperature: 0.7 })

    let messageHistory:string = "";

    if (await localForage.getItem("vectorStoreData") == null){
      messageHistory = `${dateString}: `; 
      for (let i = 0; i < messages.length; i++) {
        messageHistory = messageHistory.concat(`${messages[i].role}: ${messages[i].content};`)
      }
      const splitter = new RecursiveCharacterTextSplitter({chunkSize:100,chunkOverlap:20});
      const output = await splitter.createDocuments([messageHistory]);
      embedder = new OpenAIEmbeddings({openAIApiKey:key});
      let vectors:Map<number[][],Document[]>= new Map();
      let docs:Document[] = [];
      let docStrings:string[]=[];
      for (let i = 0; i < output.length; i++){
      docs.push(output[i]);
      docStrings.push(output[i].pageContent);
      }
      const vectorKey = await embedder.embedDocuments(docStrings);
      vectors.set(vectorKey, docs)
      await localForage.setItem("vectorStoreData", vectors);
      
    }
    else {
      messageHistory =`${dateString}: `; 
      for (let i = 0; i < messages.length; i++) {
        messageHistory = messageHistory.concat(`${messages[i].role}: ${messages[i].content};\n `)
      }
      const splitter = new RecursiveCharacterTextSplitter({chunkSize:100,chunkOverlap:20});
      const output = await splitter.createDocuments([messageHistory]);
      embedder = new OpenAIEmbeddings({openAIApiKey:key});
      let vectors:any = await localForage.getItem("vectorStoreData")
      let docs:Document[] = [];
      let docStrings:string[]=[];
      for (let i = 0; i < output.length; i++){
      docs.push(output[i]);
      docStrings.push(output[i].pageContent);
      }
      const vectorKey = await embedder.embedDocuments(docStrings);
      vectors.set(vectorKey, docs)
      await localForage.setItem("vectorStoreData", vectors);
      
    }

    if (await localForage.getItem("importantItems") === null) {
      const importantItems = await chat.call([new HumanChatMessage(`This is the message history between you and the user: "${messageHistory}".
       What are the tasks or to-do's or any other lists the user has discussed about? Answer concisely in Markdown format of a checkbox list with a heading for each list as it's title, and use specific dates at all times`)])
      localForage.setItem("importantItems", importantItems.text);
    }
    else {
      const importantItems = await chat.call([new HumanChatMessage(`This is the message history between you and the user: "${messageHistory}".
       These are the tasks you have for the user so far: "${String(await localForage.getItem('importantItems'))}".
       Update the tasks or to-do's or other lists based on what the user has discussed. Answer concisely in Markdown format of a checkbox list with a heading for each list as it's title, and use specific dates at all times.`)])
      localForage.setItem("importantItems",String(importantItems.text));
    }
    setLoadingSave(false);
    handleReset();
  };

  // const handleLoad:string = async (message:string) => {
  //   if (await localForage.getItem("vectorStoreData") != null){
  //     let vectors:any = await localForage.getItem("vectorStoreData")
  //     let vectorStore:MemoryVectorStore = new MemoryVectorStore(new OpenAIEmbeddings({openAIApiKey:key}) );
  //     vectors.forEach(async (values:Document[],keys:number[][]) => {
  //       await vectorStore.addVectors(keys,values)
  //     });
  //     const results = await vectorStore.similaritySearch(message, 5);
  //     let resultConcat = "";
  //     for (let i = 0; i < results.length; i++) {
  //       resultConcat = resultConcat.concat(`${results[i].pageContent};`)
  //     }
  //     console.log(`Result concat: ${resultConcat}`)
  //     return resultConcat
  //   }
  // };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    setMessages([
      {
        role: "assistant",
        content: `Hi there!`
      }
    ]);
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

      <div className="flex flex-col h-screen">
        <Navbar />

        <div className="flex-1 overflow-auto sm:px-10 pb-4 sm:pb-10">
          <div className="max-w-[800px] mx-auto mt-4 sm:mt-12">
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
        </div>
        <Footer />
      </div>
    </>
  );
  }
