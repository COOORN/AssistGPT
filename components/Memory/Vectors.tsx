import { FC } from "react";
import { CopyVectors } from "./CopyVectors";

interface Props {
  onVectorsChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  vectors: string;
}

export const Vectors: FC<Props> = ({ vectors, onVectorsChange }) => {
  return (
    <div className="dark:bg-neutral-800 rounded-lg border dark:border-black border-neutral-300 px-4 py-4 mx-4 my-4">
      <div className="flex-col">
        <p className="flex-col font-sans text-xl dark:text-white">
          All Memories
        </p>
        <p className="flex-col font-sans text-lg dark:text-white">
          Use for Export and Import
        </p>
        <div className="font-sans py-2">
          <textarea
            value={vectors}
            onChange={onVectorsChange}
            name="Vectors"
            id="Vectors"
            className="block resize-none w-full h-full rounded-md px-2 py-2 border dark:border-none text-gray-900 dark:text-white dark:bg-neutral-700 dark:focus:ring-black overflow-hidden"
          />
        </div>
      </div>
      <CopyVectors vectors={vectors} />
    </div>
  );
};
