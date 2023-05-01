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

let noteKeys=[""];

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingSave,setLoadingSave] = useState<boolean>(false);

  const [thoughts, setThoughts] = useState<string>("None!");
  const [lastThought, setLastThought] = useState<string>("");

  const [notes, setNotes] = useState<Map<string,string>>(new Map([["Notes","Notes made by AssistGPT will appear under here!"]]));

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
      `You are AssistGPT, a helpful, friendly AI assistant that helps the user, specializing in helping the user keep track of to-do's and making notes for them. You will try to keep the conversation going and will always try to ask the user follow up questions.
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
    if (thoughts == "None!") {
      console.log(`History:${messageHistory} <==> Important: NONE SO FAR <==> Context: ${contextInjection}`)
      var response = await chain.call({importantItems: "NONE", historicalData:contextInjection, messageHistory: messageHistory, text: message.content});
    }
    else if (thoughts != "None!") {
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

    if (thoughts == "None!") {
      const importantItems = await chat.call([new HumanChatMessage(`This is the message history between you and the user: "${messageHistory}".
       If and ONLY IF the user asked to set a task or to-do, answer with just a markdown numbered list of their todos
       and use specific dates when possible. Ignore any notes they asked to set. Otherwise write "None".
       Do NOT write anything extra.`)])
      localForage.setItem("importantItems", importantItems.text);
      setThoughts(importantItems.text);
      setLastThought(importantItems.text);
    }
    else {
      setLastThought(thoughts);
      const importantItems = await chat.call([new HumanChatMessage(`This is the message history between you and the user: "${messageHistory}".
      These are the current to-do's of the user you are in charge of keeping track of: "${thoughts}".
      Update the list if and ONLY IF there are updates to tasks or to-do's. Ignore any notes they asked to set. Just return the same list if the user did not ask for any changes.
      Do NOT write anything extra.
      `)])
      localForage.setItem("importantItems",String(importantItems.text));
      setThoughts(importantItems.text);
    }

    const newNotes = await chat.call([new HumanChatMessage(`This is the message history between you and the user: "${messageHistory}".
    Make any notes for the user that the user asked to be written for them and write them in the format "title~content====title2~content". For example, a sample note could be "====Favorite color~Green====Favorite movie~Inception====". If the note includes the character "~" replace it with "tilda".
    Write "None" if the user did not ask to make any notes.
    Do NOT write anything extra. Do NOT write notes that the user did not ask to be written. Do NOT write to-do's or tasks as notes.`)]);
    console.log(newNotes.text)
    if (newNotes.text != "None") {
    for (let i=0; i<newNotes.text.split("====").length; i++){
      setNotes(new Map(notes.set(newNotes.text.split("====")[i].split("~")[0],newNotes.text.split("====")[i].split("~")[1])));
      localForage.setItem("notes", notes);
    }
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
    const setInitials =async () => {
      if (await localForage.getItem("importantItems") != null){
        setThoughts(String(await localForage.getItem("importantItems")));
        setLastThought(String(await localForage.getItem("importantItems")));
      }
      if (await localForage.getItem("notes") != null){
        let localNotes:any = await localForage.getItem("notes");
        setNotes(localNotes);
      }
    }
    setInitials();
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
            <div className="font-sans py-2"><ReactMarkdown remarkPlugins={[remarkGFM]}>{thoughts}</ReactMarkdown></div></div>
            <UndoThoughts onUndo={handleUndo} />
            </div>
            {Array.from(notes.keys()).map((key) => (
            <div className="rounded-lg border border-neutral-300 px-4 py-4 mx-4 my-4">
            <div className="flex-col">
                              <><div key={key} className="font-sans text-xl">{key}</div><div key={key} className="font-sans py-2">{notes.get(key)}</div></>
              </div>
              </div>
              ))}
        </div>
      </div>

    </>
  );
  }
