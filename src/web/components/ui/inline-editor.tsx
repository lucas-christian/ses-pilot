import { useEffect, useRef, useState } from 'react';

export const InlineEditor = ({
  initialValue = '',
  placeholder,
  onCancel,
  onSubmit,
}: {
  initialValue?: string;
  placeholder?: string;
  onCancel: () => void;
  onSubmit: (value: string) => void;
}) => {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);


  // click outside cancela (útil se usuário clicar fora do explorer)
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!inputRef.current) return;
      if (!(e.target instanceof Node)) return;
      if (!inputRef.current.contains(e.target)) {
        onCancel();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onCancel]);

  const submit = () => {
    const v = value.trim();
    if (!v) {
      onCancel(); // se vazio, não cria (estilo VSCode)
      return;
    }
    onSubmit(v);
  };

  return (
    <div className="flex items-center gap-2 px-2 py-1">
      {/* você pode estilizar com seu Input / classes */}
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
          else if (e.key === 'Escape') onCancel();
        }}
        placeholder={placeholder}
        className="text-xs h-8 w-full px-2 rounded border"
      />
    </div>
  );
}
