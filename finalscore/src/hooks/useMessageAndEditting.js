import { useState } from "react";

export default function useMessageAndEditing(initialEditing = null) {
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState(initialEditing);

  function clearMessage() {
    setMessage("");
  }

  function showMessage(text) {
    setMessage(text);
  }

  function startEditing(item) {
    setEditing(item);
  }

  function stopEditing() {
    setEditing(null);
  }

  return {
    message,
    setMessage,
    clearMessage,
    showMessage,

    editing,
    setEditing,
    startEditing,
    stopEditing,
  };
}