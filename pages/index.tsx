import { Chat } from "@/components/Chat/Chat";
import { Navbar } from "@/components/Layout/Navbar";
import { Message } from "@/types";
import Head from "next/head";
import Link from "next/link";
import { FC, KeyboardEvent, useEffect, useRef, useState } from "react";
import Router from 'next/router'
import localForage from "localforage";


export default function Home () {
    //useEffect(() => {
        //if (localForage.getItem("APIKEY") !== null){

                //Router.push('/app')

                //}      
        //else {
            //Router.push('/');
        //}
            //},
             //[]);


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
        if (!content && localForage.getItem("APIKEY") === null) {
          alert("Please enter a key. No key provided previously either.");
          return;
        }
        else if(!content && localForage.getItem("APIKEY") != null){
        return;
        }
        else {
          localForage.setItem("APIKEY", String(content));
        }
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
      <div className="dark:bg-neutral-900 flex flex-col h-screen">

      <Navbar />



          <div className="grid-cols-1 mx-auto my-auto">
        <label className="block text-sm font-semibold leading-6 text-gray-900 dark:text-white">OpenAI Key - Just click go to app if you have previously entered the key before</label>
        <div className="my-2">
          <textarea          
          value={content}
        onKeyDown={handleKeyDown} 
        onChange={handleChange}
 name="OpenAI Key" id="OpenAI Key" autoComplete="key" className="w-full h-full my-2 rounded-md px-2 py-2 border dark:border-none text-gray-900 dark:text-white dark:bg-neutral-700 dark:focus:ring-black" />
 <br></br>
           <Link  href="app/" onClick={handleSend} className="block w-auto rounded-md bg-blue-600 px-3.5 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Go to app</Link>
        </div>
      </div>
          </div>

        </>

    );
  };