import { FC } from "react";

interface Props {
  onUndo: () => void;
}

export const UndoThoughts: FC<Props> = ({ onUndo}) => {
  return (
    <button onClick={() => onUndo()} className="block basis-1/4 rounded-md bg-blue-600 px-2.5 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Undo</button>
  );
};