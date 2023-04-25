import { Chat } from "@/components/Chat/Chat";
import { Footer } from "@/components/Layout/Footer";
import { Navbar } from "@/components/Layout/Navbar";
import { Message } from "@/types";
import Head from "next/head";
import Link from "next/link";
import { FC, KeyboardEvent, useEffect, useRef, useState } from "react";
import Router from 'next/router'

export default function Home () {
    useEffect(() => {
        if (localStorage.getItem("APIKEY") !== null){

                Router.push('/app')

                }      
        else {
            Router.push('/');
        }
            },
             []);


    const [content, setContent] = useState<string>();

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            setContent(e.target.value);
        }

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          handleSend();
        }
      };


      const handleSend = () => {
        if (!content) {
          alert("Please enter a message");
          return;
        }
        localStorage.setItem("APIKEY",content);
        }
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
          <div className="sm:col-span- mx-auto">
        <label className=" block text-sm font-semibold leading-6 text-gray-900">OpenAI Key</label>
        <div className="mt-2.5">
          <textarea          
          value={content}
        onKeyDown={handleKeyDown} 
        onChange={handleChange}
 name="OpenAI Key" id="OpenAI Key" autoComplete="organization" className="block w-full rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
 <br></br>
           <Link  href="app/" onClick={handleSend} className="block w-auto rounded-md bg-blue-600 px-3.5 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Go to app</Link>

        </div>
      </div>
          </div>
        </div>
        <Footer />
      </div>
        </>

    );
  };