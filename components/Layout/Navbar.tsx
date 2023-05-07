import { FC } from "react";

export const Navbar: FC = () => {
  return (
    <>
      <br />
      <div className="dark:bg-neutral-800 border dark:border-none rounded-lg flex-row mx-2 py-2 px-2 sm:px-8">
        <div className="flex-auto font-semibold text-3xl items-center">
          <a className="dark:text-white ml-2 hover:opacity-50">Assist GPT</a>
        </div>
      </div>
    </>
  );
};
