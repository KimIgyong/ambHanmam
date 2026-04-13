/**
 * 코멘트 내용에서 @사용자명 패턴을 추출하여 매칭되는 사용자 ID 반환.
 * - 코멘트 작성자 본인은 제외
 * - 중복 제거
 */
export function extractMentionedUserIds(
  content: string,
  users: { usrId: string; usrName: string }[],
  authorId: string,
): string[] {
  const mentionPattern = /@([^\s@]+)/g;
  const mentions: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = mentionPattern.exec(content)) !== null) {
    mentions.push(match[1]);
  }

  if (mentions.length === 0) return [];

  const matchedIds = new Set<string>();

  // 긴 이름 우선 매칭을 위해 이름 길이 내림차순 정렬
  const sortedUsers = [...users].sort(
    (a, b) => b.usrName.length - a.usrName.length,
  );

  for (const mention of mentions) {
    for (const user of sortedUsers) {
      if (
        user.usrId !== authorId &&
        mention.toLowerCase() === user.usrName.toLowerCase()
      ) {
        matchedIds.add(user.usrId);
        break;
      }
    }
  }

  return Array.from(matchedIds);
}
