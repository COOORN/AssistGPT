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
  //onReset: () => void;
  onSave: () => void;
  loadingSave: boolean;
}

export const Chat: FC<Props> = ({ messages, loading, onSend, 
 // onReset, 
  onSave, loadingSave }) => {
  // return (
  //   <>
  //     <div className="flex flex-row justify-between items-center mb-4 sm:mb-8">
  //       ResetChat onReset={onReset} />
  //     </div>
      return (
        <>


      <div className="flex flex-col rounded-lg px-4 py-4 border border-neutral-300 gap-3">
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
        <div className="flex flex-row">
      <SaveChat loadingSave = {loadingSave} onSave={onSave}></SaveChat>
    </div>

      </div> 

    </>
  );
};
