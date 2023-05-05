import { FC } from "react";

interface Props {
    content: string;
    onChange: () => void;
}

export const Thoughts: FC<Props> = ({ content, onChange }) => {
  return (
    <>
<textarea          
          value={content}
        onChange={onChange}
 name="Thoughts" id="Thoughts" className="block w-full rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />

 </>
  );
};
;