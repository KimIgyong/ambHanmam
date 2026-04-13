/**
 * HTML 문자열 내의 URL을 자동으로 하이퍼링크로 변환한다.
 * 이미 <a> 태그 안에 있는 URL은 건너뛴다.
 */
export function autoLinkUrls(html: string, maxDisplayLength = 80): string {
  // <a ...>...</a> 태그를 임시 플레이스홀더로 치환
  const anchors: string[] = [];
  const placeholder = '\x00ANCHOR';
  const withPlaceholders = html.replace(/<a\s[^>]*>[\s\S]*?<\/a>/gi, (match) => {
    anchors.push(match);
    return `${placeholder}${anchors.length - 1}\x00`;
  });

  // URL 패턴 매칭 및 변환
  const urlPattern = /https?:\/\/[^\s<>"')\]]+/g;
  const linked = withPlaceholders.replace(urlPattern, (url) => {
    const display = url.length > maxDisplayLength
      ? `${url.substring(0, maxDisplayLength)}...`
      : url;
    return `<a href="${url}" target="_blank" rel="noopener noreferrer">${display}</a>`;
  });

  // 플레이스홀더 복원
  return linked.replace(new RegExp(`${placeholder}(\\d+)\x00`, 'g'), (_, idx) => anchors[Number(idx)]);
}
