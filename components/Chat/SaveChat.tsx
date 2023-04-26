import { FC } from "react";

interface Props {
  onSave: () => void;
  loadingSave: boolean;
}

export const SaveChat: FC<Props> = ({ onSave, loadingSave }) => {
  return (
    <button   onClick={() => onSave()} className="block w-full rounded-md bg-blue-600 px-3.5 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">{loadingSave && "Saving..."}{!loadingSave && "Save"}</button>
  );
};