# TC-이슈리플라이멘션이모지알림-Test-20260402

## 1. 테스트 범위

| 구분 | 대상 |
|------|------|
| R1 | 리플라이 에디터 멘션/이모지 지원 |
| R2 | 리플라이 자동 멘션 알림 (원글 작성자) |
| R3 | 이모지 리액션 알림 |
| R4 | 이슈 별점 알림 |

## 2. 단위 테스트 케이스

### TC-01: 리플라이 에디터 멘션 기능
| 항목 | 내용 |
|------|------|
| 조건 | 이슈 코멘트에 리플라이 작성 |
| 입력 | @ 입력 시 멘션 드롭다운 표시 |
| 기대 | MentionPortalDropdown이 표시되고, 사용자 선택 시 멘션 태그 삽입 |

### TC-02: 리플라이 이모지 리액션 UI
| 항목 | 내용 |
|------|------|
| 조건 | 이슈 리플라이 표시 시 |
| 기대 | 각 리플라이 하단에 👍✅🙏😀❤️ 이모지 버튼 표시, 클릭 시 toggleReaction API 호출 |

### TC-03: 리플라이 자동멘션 - 원글 작성자 알림
| 항목 | 내용 |
|------|------|
| 조건 | 사용자 A가 코멘트 작성, 사용자 B가 멘션 없이 리플라이 |
| 입력 | `addIssueComment(issueId, content, B, 'USER', parentId)` |
| 기대 | `MENTION_EVENT` emit → recipientIds: [A의 usrId] |

### TC-04: 리플라이 자동멘션 - 자기 답글 제외
| 항목 | 내용 |
|------|------|
| 조건 | 사용자 A가 본인 코멘트에 리플라이 |
| 기대 | `parentComment.iscAuthorId === userId` → 알림 미발행 |

### TC-05: 리플라이 명시 멘션 우선
| 항목 | 내용 |
|------|------|
| 조건 | 리플라이에 @사용자C 멘션 포함 |
| 기대 | 명시 멘션에 의한 `MENTION_EVENT` 발행 (자동멘션 X) |

### TC-06: 이모지 리액션 알림 - 추가 시
| 항목 | 내용 |
|------|------|
| 조건 | 사용자 B가 사용자 A의 코멘트에 LIKE 리액션 추가 |
| 입력 | `toggleCommentReaction(commentId, 'LIKE', B)` |
| 기대 | `REACTION_EVENT` emit → recipientId: A, reactionType: 'LIKE' |

### TC-07: 이모지 리액션 알림 - 제거 시
| 항목 | 내용 |
|------|------|
| 조건 | 이미 LIKE한 코멘트에 다시 LIKE 토글 (제거) |
| 기대 | 리액션 제거만, 알림 미발행 |

### TC-08: 이모지 리액션 알림 - 자기 코멘트
| 항목 | 내용 |
|------|------|
| 조건 | 본인 코멘트에 리액션 |
| 기대 | `comment.iscAuthorId === userId` → 알림 미발행 |

### TC-09: 별점 알림 - 정상
| 항목 | 내용 |
|------|------|
| 조건 | 사용자 B가 사용자 A가 작성한 이슈에 ⭐5 평가 |
| 입력 | `upsertIssueRating(issueId, B, 5)` |
| 기대 | `RATING_EVENT` emit → recipientId: A, rating: 5 |

### TC-10: 별점 알림 - 자기 이슈 차단
| 항목 | 내용 |
|------|------|
| 조건 | 본인 이슈에 별점 시도 |
| 기대 | `ForbiddenException` 발생 (기존 로직), 알림 미도달 |

## 3. 통합 테스트 시나리오

### IT-01: 리액션 → 알림 → SSE → Push 전체 흐름
1. 사용자 B가 사용자 A의 코멘트에 👍 클릭
2. `toggleCommentReaction` → `REACTION_EVENT` emit
3. `NotificationListener.handleCommentReaction` → DB 저장
4. SSE emit → 사용자 A 실시간 알림 수신
5. Web Push → 사용자 A 디바이스 알림
6. 알림 메시지: "B님이 이슈 코멘트에 👍를 눌렀습니다."

### IT-02: 별점 → 알림 → SSE → Push 전체 흐름
1. 사용자 B가 사용자 A의 이슈에 ⭐5 평가
2. `upsertIssueRating` → `RATING_EVENT` emit
3. `NotificationListener.handleContentRating` → DB 저장
4. SSE emit → 사용자 A 실시간 알림 수신
5. 알림 메시지: "B님이 이슈에 ⭐5개를 주셨습니다."

### IT-03: 리플라이 자동멘션 → 알림 전체 흐름
1. 사용자 A가 이슈에 코멘트 작성
2. 사용자 B가 멘션 없이 리플라이
3. `addIssueComment` → `MENTION_EVENT` emit (recipientIds: [A])
4. 사용자 A에게 "B님이 이슈 코멘트에서 멘션했습니다." 알림

## 4. 엣지 케이스

| # | 케이스 | 기대 결과 |
|---|--------|-----------|
| E1 | 삭제된 코멘트에 리액션 | commentRepository.findOne null → 알림 미발행 |
| E2 | 삭제된 이슈에 별점 | issueRepo.findOne null → BadRequestException |
| E3 | 동시 리액션 (race condition) | try-catch로 에러 억제, warn 로그 |
| E4 | 별점 업데이트 (기존 3→5) | upsert 정상, 알림 발행 (새 별점) |
| E5 | 이모지 타입 이외 문자열 | REACTION_EMOJI_MAP fallback → reactionType 그대로 표시 |
