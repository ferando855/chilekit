export function textJson(value: unknown) {
  return {
    content: [
      {
        text: JSON.stringify(value, null, 2),
        type: "text" as const,
      },
    ],
  };
}
