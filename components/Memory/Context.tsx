import { FC } from "react";
import { useEffect, useRef, useState } from "react";

interface Props {
  context: string;
}

export const Context: FC<Props> = ({ context }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  return (
    <div className="dark:bg-neutral-800 rounded-lg border dark:border-black border-neutral-300 px-4 py-4 mx-4 my-4">
      <div className="flex-col">
        <p className="flex-col font-sans text-xl dark:text-white">
          Context from past memories:
        </p>
        <div className="font-sans py-2">
          <textarea
            value={context}
            name="Context"
            id="Context"
            ref={textareaRef}
            className="block w-full h-full rounded-md px-2 py-2 border dark:border-none text-gray-900 dark:text-white dark:bg-neutral-700 dark:focus:ring-black overflow-hidden"
          />
        </div>
      </div>
    </div>
  );
};
