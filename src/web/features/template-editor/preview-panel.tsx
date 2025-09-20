'use client';

interface PreviewPanelProps {
  htmlContent: string;
}

export function PreviewPanel({ htmlContent }: PreviewPanelProps) {
  return (
    <div className="w-full h-full border rounded-md bg-white overflow-hidden">
      <iframe
        srcDoc={htmlContent}
        title="Visualização do E-mail"
        className="w-full h-full border-0"
        sandbox="allow-same-origin"
        style={{ 
          minHeight: '100%',
          display: 'block'
        }}
      />
    </div>
  );
}