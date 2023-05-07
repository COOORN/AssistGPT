import { FC } from "react";
import { useEffect, useRef, useState } from "react";
import { UndoThoughts } from "./UndoThoughts";

interface Props {
  onThoughtsChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  thoughts: string;
  onUndo: () => void;
}

export const Thoughts: FC<Props> = ({ thoughts, onThoughtsChange, onUndo }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.style.setProperty("height", "");
    textareaRef.current?.style.setProperty(
      "height",
      `${textareaRef.current?.scrollHeight}px`
    );
  });

  return (
    <div className="dark:bg-neutral-800 rounded-lg border dark:border-black border-neutral-300 px-4 py-4 mx-4 my-4">
      <div className="flex-col">
        <p className="font-sans text-xl dark:text-white">
          AssistGPT's Persistent Memory:
        </p>
        <div className="font-sans py-2">
          <textarea
            value={thoughts}
            onChange={onThoughtsChange}
            ref={textareaRef}
            name="Thoughts"
            id="Thoughts"
            className="block w-full h-full rounded-md px-3.5 py-2 border dark:border-none text-gray-900 dark:text-white dark:bg-neutral-700 dark:focus:ring-black"
          />
        </div>
      </div>
      <UndoThoughts onUndo={onUndo} />
    </div>
  );
};
