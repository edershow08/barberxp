import { useContext } from "react";

import { PlayerContext } from "../context/PlayerContext";

export function usePlayer() {
  const context = useContext(PlayerContext);

  if (!context) {
    throw new Error(
      "usePlayer deve ser utilizado dentro do PlayerProvider.",
    );
  }

  return context;
}