import { useState } from "react";

export default function useForm(initialValues) {
  const [form, setForm] = useState(initialValues);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function reset(values = initialValues) {
    setForm(values);
  }

  return {
    form,
    setForm,
    handleChange,
    reset,
  };
}