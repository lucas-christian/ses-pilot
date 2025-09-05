'use client';

interface PreviewPanelProps {
  htmlContent: string;
}

export function PreviewPanel({ htmlContent }: PreviewPanelProps) {
  return (
    <div className="w-full h-full border rounded-md bg-white">
      <iframe
        srcDoc={htmlContent}
        title="Visualização do E-mail"
        className="w-full h-full"
        sandbox="allow-same-origin"
      />
    </div>
  );
}