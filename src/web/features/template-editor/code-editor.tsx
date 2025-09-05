'use client';

import Editor from '@monaco-editor/react';
import { Loader2 } from 'lucide-react';
import { useTheme } from 'next-themes';

interface CodeEditorProps {
  value: string;
  onChange: (value?: string) => void;
  language?: string;
}

export function CodeEditor({ value, onChange, language = 'html' }: CodeEditorProps) {
  const { theme } = useTheme();

  return (
    <Editor
      height="100%"
      language={language}
      theme={theme === 'dark' ? 'vs-dark' : 'light'}
      value={value}
      onChange={onChange}
      loading={<Loader2 className="w-8 h-8 animate-spin" />}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        wordWrap: 'on',
        lineNumbers: 'on',
        automaticLayout: true,
        tabSize: 2,
        insertSpaces: true,
      }}
    />
  );
}