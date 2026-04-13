# REQ-법인멤버UnitCell지정-20260305

## 요구사항 분석서

### 1. 개요
법인 Member Detail 페이지에서 멤버의 Unit/Cell을 Organization에서 등록한 조직과 연결하여 관리할 수 있도록 개선한다.

### 2. AS-IS 현황
- 멤버의 `department` 필드가 자유 텍스트(VARCHAR)로 관리됨
- Organization 페이지에서 등록한 Unit/Cell과 연결되지 않음
- 신규 멤버 초대 시 기본 Unit이 없어 관리 사각지대 발생
- `amb_user_unit_roles` 테이블이 있으나 초대/등록 시 자동 배정 안 됨

### 3. TO-BE 요구사항
1. **법인 신규 생성 시 "Holding" 기본 Unit 자동 생성**
2. **기존 법인에도 "Holding" Unit 자동 추가** (서버 시작 시)
3. **신규 초대 멤버는 기본 Unit을 "Holding"으로 배정**
4. **MASTER가 멤버의 Unit 변경 가능**
5. **Member Detail에서 Unit/Cell 드롭다운 선택 가능**
6. **Holding Unit은 삭제 불가**

### 4. 갭 분석
| 항목 | AS-IS | TO-BE | 갭 |
|------|-------|-------|-----|
| Unit 배정 | 텍스트 입력 | 드롭다운 선택 (amb_units 연동) | 백엔드 API + 프론트 UI |
| Cell 배정 | 없음 | 배지 + 추가/제거 | 백엔드 API + 프론트 UI |
| 기본 Unit | 없음 | "Holding" 자동 생성/배정 | EntitySeedService 수정 |
| 초대 시 Unit | department 텍스트 | Holding 자동 배정 | InvitationService 수정 |

### 5. 사용자 플로우
1. MASTER가 Members 페이지에서 멤버 클릭 → Detail Modal 표시
2. Edit 버튼 → Unit 드롭다운에서 새 Unit 선택 → Save
3. Cell 섹션에서 + 버튼 → Cell 드롭다운에서 선택 → 배지 추가
4. Cell 배지의 X 버튼 → Cell 제거

### 6. 기술 제약사항
- `usrUnit` (VARCHAR) 필드는 하위 호환을 위해 유지하되, Unit 변경 시 동기화
- `UserUnitRoleEntity`의 soft delete 패턴(`uurEndedAt`) 유지
