import { FC } from "react";
import { useEffect, useRef, useState } from "react";

interface Props {
  onThoughtsChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  thoughts: string;
}

export const Thoughts: FC<Props> = ({ thoughts, onThoughtsChange }) => {

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        textareaRef.current?.style.setProperty("height","");
        textareaRef.current?.style.setProperty("height",`${textareaRef.current?.scrollHeight}px`);
  });

  return (
    <textarea          
    value={thoughts}
    onChange={onThoughtsChange}
    ref={textareaRef}
    name="Thoughts" id="Thoughts" 
    className="block w-full h-full rounded-md px-3.5 py-2 border dark:border-none text-gray-900 dark:text-white dark:bg-neutral-700 dark:focus:ring-black" />  );
};