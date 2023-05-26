import { Message } from "@/types";
import { FC } from "react";
import { ChatInput } from "./ChatInput";
import { ChatLoader } from "./ChatLoader";
import { ChatMessage } from "./ChatMessage";
import { ResetChat } from "./ResetChat";
import { SaveChat } from "./SaveChat";


interface Props {
  messages: Message[];
  loading: boolean;
  onSend: (message: Message) => void;
  onSave: () => void;
  loadingSave: boolean;
  totalTokens: number;
}

export const Chat: FC<Props> = ({ messages, loading, onSend, onSave, loadingSave, totalTokens }) => {

      return (
        <>


      <div className="flex flex-col rounded-lg px-4 py-4 border dark:bg-neutral-800 dark:border-black border-neutral-300 gap-3">
        {messages.map((message, index) => (
          <div
            key={index}
            className="my-1 sm:my-1.5"
          >
            <ChatMessage message={message} />
          </div>
        ))}

        {loading && (
          <div className="my-1 sm:my-1.5">
            <ChatLoader />
          </div>
        )}

        <div className="mt-4 sm:mt-8 bottom-[56px] left-0 w-full">
          <ChatInput onSend={onSend} />
        </div>
        <div className="grid grid-cols-4">
          <div className="grid col-start-1 col-span-1">
      <SaveChat loadingSave = {loadingSave} onSave={onSave}></SaveChat>
      </div>
          <div className="grid col-start-4 col-span-1"><p className="text-sm flex flex-row-reverse text-white">About {totalTokens}/3800 tokens used</p></div>
    </div>


      </div> 

    </>
  );
};
