interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export function Textarea({ className = "", ...props }: TextareaProps) {
  return (
    <textarea
      className={`block w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-50 placeholder-zinc-500 focus:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-700 ${className}`}
      {...props}
    />
  );
}
