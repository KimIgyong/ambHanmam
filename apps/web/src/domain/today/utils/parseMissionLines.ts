export interface ParsedMissionLine {
  lineIndex: number;
  text: string;
  html: string;
}

/**
 * <br> 기준으로 블록 요소 내부를 분할하여 각 세그먼트를 별도 라인으로 추출한다.
 * TipTap 에디터에서 Shift+Enter → <br>, Enter → 새 <p> 이므로
 * 하나의 <p> 안에 <br>로 구분된 여러 줄이 있을 수 있다.
 */
function splitByBr(el: Element): { text: string; html: string }[] {
  const innerHTML = el.innerHTML;

  // <br> 태그가 없으면 분할 불필요
  if (!/<br\s*\/?>/i.test(innerHTML)) {
    const text = (el.textContent || '').trim();
    if (text.length > 0) {
      return [{ text, html: innerHTML }];
    }
    return [];
  }

  // <br> 기준으로 분할
  const segments = innerHTML.split(/<br\s*\/?>/i);
  const result: { text: string; html: string }[] = [];

  for (const seg of segments) {
    const tmp = document.createElement('span');
    tmp.innerHTML = seg;
    const text = (tmp.textContent || '').trim();
    if (text.length > 0) {
      result.push({ text, html: seg.trim() });
    }
  }

  return result;
}

export function parseMissionLines(html: string): ParsedMissionLine[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const lines: ParsedMissionLine[] = [];

  function pushLine(text: string, lineHtml: string) {
    lines.push({ lineIndex: lines.length, text, html: lineHtml });
  }

  function extractFromElement(el: Element) {
    const tag = el.tagName.toLowerCase();

    // 리스트 컨테이너는 자식 li로 순회
    if (tag === 'ul' || tag === 'ol') {
      el.querySelectorAll(':scope > li').forEach((li) => {
        // li 안에도 <br>이 있을 수 있다
        for (const seg of splitByBr(li)) {
          pushLine(seg.text, seg.html);
        }
      });
      return;
    }

    // 블록 요소: p, h1~h6, div, blockquote — <br> 기준 분할
    if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'blockquote'].includes(tag)) {
      for (const seg of splitByBr(el)) {
        pushLine(seg.text, seg.html);
      }
      return;
    }
  }

  // body 직속 자식 요소 순회
  const children = doc.body.children;
  for (let i = 0; i < children.length; i++) {
    extractFromElement(children[i]);
  }

  // HTML에 블록 요소가 없는 경우 (plain text), 전체를 하나의 라인으로
  if (lines.length === 0) {
    const text = (doc.body.textContent || '').trim();
    if (text.length > 0) {
      lines.push({ lineIndex: 0, text, html });
    }
  }

  return lines;
}
