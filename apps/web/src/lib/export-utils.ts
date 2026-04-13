export function downloadAsMarkdown(content: string, filename?: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `response-${Date.now()}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadAsPdf(
  element: HTMLElement,
  filename?: string,
): Promise<void> {
  const html2pdf = (await import('html2pdf.js')).default;
  await html2pdf()
    .set({
      margin: [10, 10, 10, 10] as [number, number, number, number],
      filename: filename || `response-${Date.now()}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
    })
    .from(element)
    .save();
}
